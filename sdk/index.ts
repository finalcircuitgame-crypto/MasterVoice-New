import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// --- Types ---

export type SDKPlan = 'free' | 'pro' | 'elite';

export interface SDKConfig {
  apiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  autoConnect?: boolean;
}

export interface CallConfig {
  audio?: boolean;
  video?: boolean;
  screen?: boolean;
}

export interface TelemetryData {
  id: string;
  timestamp: string;
  region: string;
  metrics: {
    rtt: number;
    jitter: number;
    packet_loss: number;
    cpu_load: number;
    active_streams: number;
  };
  status: 'operational' | 'degraded' | 'down';
}

// --- ICE Server Configurations ---

const TIER_CONFIGS = {
  free: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], 
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    maxBitrate: 500000 
  },
  pro: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { 
        urls: 'turn:relay1.expressturn.com:3480?transport=udp', 
        username: process.env.ICE_USERNAME || '000000002080624754', 
        credential: process.env.ICE_CREDENTIAL || 'TplmyCeWBfBAapvocrUf2IQx5u8=' 
      }
    ],
    iceTransportPolicy: 'relay' as RTCIceTransportPolicy, 
    maxBitrate: 2000000 
  },
  elite: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { 
        urls: 'turn:relay1.expressturn.com:3480?transport=tcp', 
        username: process.env.ICE_USERNAME || '000000002080624754', 
        credential: process.env.ICE_CREDENTIAL || 'TplmyCeWBfBAapvocrUf2IQx5u8=' 
      }
    ],
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    maxBitrate: 10000000 
  }
};

// --- Main SDK Class ---

export class MasterVoice {
  public supabase: SupabaseClient;
  public plan: SDKPlan;
  private apiKey: string;
  private pc: RTCPeerConnection | null = null;
  private signalingChannel: RealtimeChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  
  private listeners: Record<string, Function[]> = {};

  constructor(config: SDKConfig) {
    this.apiKey = config.apiKey;
    this.plan = this.determinePlan(config.apiKey);
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    console.log(`[MasterVoice SDK] Initialized. Plan: ${this.plan.toUpperCase()}`);
  }

  private determinePlan(key: string): SDKPlan {
    if (key.startsWith('mv_elite_')) return 'elite';
    if (key.startsWith('mv_pro_')) return 'pro';
    return 'free';
  }

  public on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * Fetches health data from the /v2/telemetry REST endpoint.
   * Handled by the Service Worker to return actual JSON.
   */
  public async fetchTelemetry(): Promise<TelemetryData[]> {
    const response = await fetch('/v2/telemetry', {
      headers: {
        'Authorization': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch telemetry");
    }

    return response.json();
  }

  public async initializeCall(roomId: string, userId: string) {
    const config = TIER_CONFIGS[this.plan];
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers,
      iceTransportPolicy: this.plan === 'pro' ? 'relay' : 'all'
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.signalingChannel) {
        this.signalingChannel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate, userId }
        });
      }
    };

    this.pc.ontrack = (event) => {
      const stream = event.streams[0];
      this.remoteStream = stream;
      this.emit('track', { track: event.track, stream });
    };

    this.signalingChannel = this.supabase.channel(`room:${roomId}`);
    this.signalingChannel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (!this.pc) return;
      if (payload.userId === userId) return;

      try {
        if (payload.type === 'offer') {
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.signalingChannel?.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', sdp: answer, userId }
          });
          this.emit('call.incoming', payload);
        } 
        else if (payload.type === 'answer') {
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          this.emit('call.connected');
        } 
        else if (payload.type === 'candidate') {
          await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        this.emit('error', err);
      }
    }).subscribe();
  }

  public async startCall(config: CallConfig = { audio: true, video: false }) {
    if (!this.pc) throw new Error("Initialize call first");
    this.localStream = await navigator.mediaDevices.getUserMedia(config);
    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!);
    });
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.signalingChannel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'offer', sdp: offer }
    });
  }

  public endCall() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.pc?.close();
    this.signalingChannel?.unsubscribe();
    this.pc = null;
    this.emit('call.ended');
  }
}

const MasterVoiceContext = createContext<MasterVoice | null>(null);

export const MasterVoiceProvider: React.FC<{ client: MasterVoice; children: React.ReactNode }> = ({ client, children }) => {
  return React.createElement(MasterVoiceContext.Provider, { value: client }, children);
};

export const useMasterVoice = () => {
  const client = useContext(MasterVoiceContext);
  if (!client) throw new Error("useMasterVoice must be used within a MasterVoiceProvider");
  return client;
};