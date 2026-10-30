import { type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useUser } from '@clerk/react';
import { useLocation } from 'wouter';
import { Phone, PhoneOff, RotateCcw, Send, ShieldAlert, X } from 'lucide-react';
import { useChatResourceBridgeAssistant } from '@workspace/api-client-react';
import type { ResourceBridgeAssistantMessage } from '@workspace/api-client-react';
import { supportLanguages } from './support-languages';
import { JarvisOpening } from './jarvis-opening';
import { JarvisAvatar } from './jarvis-avatar';
import { JarvisHome } from './jarvis-home';
import { useJarvisOpening } from './use-jarvis-opening';
import './ai-assistant.css';

type ChatMessage = ResourceBridgeAssistantMessage & { id: number; audioUrl?: string };
type AccountAccess = 'undecided' | 'granted' | 'denied';
type VoiceReply = { transcript: string; audioBase64: string; audioType: string };
type VoiceCallStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';
type VoiceCallSession = {
  stream: MediaStream;
  context: AudioContext;
  analyser: AnalyserNode;
  samples: Float32Array<ArrayBuffer>;
  recorder: MediaRecorder | null;
  chunks: BlobPart[];
  active: boolean;
  processing: boolean;
  speechSince: number | null;
  lastVoiceAt: number;
  recordingStartedAt: number | null;
  rafId: number | null;
  monitor: (() => void) | null;
  startedAt: number;
};

const MAX_CONTENT = 2000;
const MAX_MESSAGES = 11;
const MAX_TOTAL = 12000;
const POSITION_STORAGE_KEY = 'resourcebridge-ai-widget-position-v1';
const PANEL_WIDTH_STORAGE_KEY = 'resourcebridge-ai-widget-width-v1';
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 720;
const HIDDEN_PREFIXES = ['/sign-in', '/sign-up', '/account-type', '/profile-setup'];
type WidgetPosition = { left: number; bottom: number };
type PanelResizeState = {
  pointerId: number;
  startX: number;
  startWidth: number;
  position: WidgetPosition | null;
};
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  left: number;
  top: number;
  width: number;
  height: number;
  source: 'launcher' | 'header';
  moved: boolean;
};

function readWidgetPosition(): WidgetPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(POSITION_STORAGE_KEY) ?? 'null');
    if (value && typeof value === 'object' && 'left' in value && 'bottom' in value &&
      typeof value.left === 'number' && Number.isFinite(value.left) &&
      typeof value.bottom === 'number' && Number.isFinite(value.bottom)) {
      return { left: value.left, bottom: value.bottom };
    }
  } catch { /* Keep the default location if browser storage is unavailable. */ }
  return null;
}

function clampPanelWidth(width: number) {
  const max = Math.max(240, Math.min(MAX_PANEL_WIDTH, window.innerWidth - 24));
  const min = Math.min(MIN_PANEL_WIDTH, max);
  return Math.round(Math.min(max, Math.max(min, width)));
}

function readPanelWidth() {
  if (typeof window === 'undefined') return 400;
  try {
    const value = Number(window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY));
    if (Number.isFinite(value) && value >= MIN_PANEL_WIDTH && value <= MAX_PANEL_WIDTH) return value;
  } catch { /* Use the standard width if browser storage is unavailable. */ }
  return 400;
}
const SUGGESTIONS = [
  'How do I find a resource near me?',
  'What happens after I request a booking?',
  'How do I start hosting a space or tool?',
  'How do ratings work after a booking?',
];
const OWNER_SUGGESTIONS = [
  'How do I add or edit a resource?',
  'How do I review an incoming request?',
  'How do returns and completed bookings work?',
  'How do I rate a customer?',
];
const CUSTOMER_SUGGESTIONS = [
  'How do I find a resource near me?',
  'What happens after I request a booking?',
  'Where can I check my bookings?',
  'How do I rate a resource owner?',
];
const CARE_SUGGESTIONS = [
  'Translate a message and identify its language.',
  'Help me write a clear, respectful support reply.',
  'Listen and help me think through a stressful situation.',
  'Answer a general customer-care question.',
];

/** Keep whole user/assistant pairs, starting with a user turn and ending with the latest user turn. */
function buildPayload(history: ChatMessage[]): ResourceBridgeAssistantMessage[] {
  let msgs = history.map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CONTENT) })).filter(m => m.content.length > 0);
  while (msgs.length && msgs[0].role !== 'user') msgs = msgs.slice(1);
  const total = (list: typeof msgs) => list.reduce((n, m) => n + m.content.length, 0);
  while (msgs.length > 1 && (msgs.length > MAX_MESSAGES || total(msgs) > MAX_TOTAL || msgs[0].role !== 'user')) {
    msgs = msgs.slice(msgs[1]?.role === 'assistant' ? 2 : 1);
  }
  return msgs;
}

function readError(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status: unknown }).status : undefined;
  let message: string | undefined;
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string') message = (data as { error: string }).error;
  }
  if (status === 429) return message ?? 'The guide is getting a lot of questions right now. Wait a moment, then retry.';
  if (status === 503) return message ?? 'The guide is temporarily unavailable. Please retry shortly.';
  return message ?? 'The guide could not answer just now. Check your connection and retry.';
}

function encodeVoiceContext(messages: ChatMessage[]) {
  const compact = messages.slice(-4).map(({ role, content }) => ({ role, content: content.slice(0, 300) }));
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function audioBlobFromBase64(audioBase64: string, audioType: string) {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: audioType });
}

function readVoiceLevel(session: VoiceCallSession) {
  session.analyser.getFloatTimeDomainData(session.samples);
  let sum = 0;
  for (const sample of session.samples) sum += sample * sample;
  return Math.sqrt(sum / session.samples.length);
}

function disposeVoiceCall(session: VoiceCallSession) {
  session.active = false;
  if (session.rafId !== null) window.cancelAnimationFrame(session.rafId);
  if (session.recorder) {
    session.recorder.ondataavailable = null;
    session.recorder.onstop = null;
    if (session.recorder.state !== 'inactive') session.recorder.stop();
  }
  session.stream.getTracks().forEach(track => track.stop());
  void session.context.close().catch(() => undefined);
}

export function AIAssistant({ careMode = false, accountType }: { careMode?: boolean; accountType?: 'owner' | 'customer' }) {
  const [path, navigate] = useLocation();
  const { user, isLoaded } = useUser();
  const userId = isLoaded ? user?.id ?? '' : null;
  const assistantName = careMode || user ? 'Jarvis' : 'ResourceBridge guide';
  const canUseVoice = isLoaded && !!user && (careMode || !!accountType);
  const suggestions = careMode ? CARE_SUGGESTIONS : accountType === 'owner' ? OWNER_SUGGESTIONS : accountType === 'customer' ? CUSTOMER_SUGGESTIONS : SUGGESTIONS;
  const chat = useChatResourceBridgeAssistant();
  const mutateRef = useRef(chat.mutateAsync);
  mutateRef.current = chat.mutateAsync;

  const [open, setOpen] = useState(false);
  const { opening, beginOpening, finishOpening } = useJarvisOpening();
  const [position, setPosition] = useState<WidgetPosition | null>(readWidgetPosition);
  const [panelWidth, setPanelWidth] = useState(readPanelWidth);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountAccess, setAccountAccess] = useState<AccountAccess>(careMode ? 'denied' : 'undecided');
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [voiceCallStarting, setVoiceCallStarting] = useState(false);
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>('idle');
  const [voiceCallSeconds, setVoiceCallSeconds] = useState(0);
  const [voicePending, setVoicePending] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const generation = useRef(0);
  const nextId = useRef(1);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const voiceCallRef = useRef<VoiceCallSession | null>(null);
  const replyAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAbortRef = useRef<AbortController | null>(null);
  const audioUrlsRef = useRef<string[]>([]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<PanelResizeState | null>(null);
  const ignoreLauncherClick = useRef(false);
  const positionRef = useRef<WidgetPosition | null>(position);
  const panelWidthRef = useRef(panelWidth);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const titleId = useId();
  const noticeId = useId();

  const updatePosition = useCallback((next: WidgetPosition) => {
    positionRef.current = next;
    setPosition(next);
  }, []);

  const updatePanelWidth = useCallback((width: number, anchor?: Pick<PanelResizeState, 'startWidth' | 'position'>) => {
    const nextWidth = clampPanelWidth(width);
    panelWidthRef.current = nextWidth;
    setPanelWidth(nextWidth);
    if (anchor?.position) {
      const maxLeft = Math.max(8, window.innerWidth - nextWidth - 8);
      const left = Math.min(Math.max(anchor.position.left + anchor.startWidth - nextWidth, 8), maxLeft);
      updatePosition({ left, bottom: anchor.position.bottom });
    }
  }, [updatePosition]);

  const persistPanelWidth = useCallback(() => {
    try { window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidthRef.current)); } catch { /* Width still works for this session. */ }
    const currentPosition = positionRef.current;
    if (currentPosition) {
      try { window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(currentPosition)); } catch { /* Position still works for this session. */ }
    }
  }, []);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, source: DragState['source']) => {
    if (!event.ctrlKey || event.button !== 0) return;
    if (source === 'header' && (event.target as HTMLElement).closest('button')) return;
    const widget = widgetRef.current;
    if (!widget) return;
    const rect = widget.getBoundingClientRect();
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      source,
      moved: false,
    };
    setDragging(true);
  };

  const beginResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: panelWidthRef.current,
      position: positionRef.current,
    };
    setResizing(true);
  };

  const onResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | null = null;
    const step = event.shiftKey ? 48 : 16;
    if (event.key === 'ArrowLeft') nextWidth = panelWidthRef.current + step;
    else if (event.key === 'ArrowRight') nextWidth = panelWidthRef.current - step;
    else if (event.key === 'Home') nextWidth = MIN_PANEL_WIDTH;
    else if (event.key === 'End') nextWidth = MAX_PANEL_WIDTH;
    if (nextWidth === null) return;
    event.preventDefault();
    const startWidth = panelWidthRef.current;
    updatePanelWidth(nextWidth, { startWidth, position: positionRef.current });
    persistPanelWidth();
  };

  const hidden = HIDDEN_PREFIXES.some(p => path === p || path.startsWith(`${p}/`));
  useEffect(() => {
    if (!open || hidden) finishOpening();
  }, [open, hidden, finishOpening]);

  const endVoiceCall = useCallback(() => {
    generation.current++;
    const session = voiceCallRef.current;
    voiceCallRef.current = null;
    if (session) disposeVoiceCall(session);
    replyAudioRef.current?.pause();
    replyAudioRef.current = null;
    voiceAbortRef.current?.abort();
    voiceAbortRef.current = null;
    inFlight.current = false;
    setVoiceCallStarting(false);
    setVoiceCallActive(false);
    setVoiceCallStatus('idle');
    setVoiceCallSeconds(0);
    setVoicePending(false);
  }, []);

  const resumeVoiceCall = useCallback(() => {
    const session = voiceCallRef.current;
    if (!session?.active) return;
    session.processing = false;
    setVoiceCallStatus('listening');
  }, []);

  useEffect(() => {
    if (!voiceCallActive) return;
    const startedAt = voiceCallRef.current?.startedAt ?? Date.now();
    const updateDuration = () => setVoiceCallSeconds(Math.floor((Date.now() - startedAt) / 1000));
    updateDuration();
    const interval = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(interval);
  }, [voiceCallActive]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      voiceAbortRef.current?.abort();
      const session = voiceCallRef.current;
      voiceCallRef.current = null;
      if (session) disposeVoiceCall(session);
      replyAudioRef.current?.pause();
      audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      audioUrlsRef.current = [];
    };
  }, []);

  const reset = useCallback(() => {
    generation.current++;
    inFlight.current = false;
    voiceAbortRef.current?.abort();
    voiceAbortRef.current = null;
    endVoiceCall();
    audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    audioUrlsRef.current = [];
    messagesRef.current = [];
    setMessages([]); setDraft(''); setPending(false); setError(null); setAccountAccess(careMode ? 'denied' : 'undecided');
    setVoicePending(false); setVoiceError(null);
  }, [careMode, endVoiceCall]);
  const revokeAccountAccess = () => {
    reset();
    setAccountAccess('denied');
  };

  // Full reset when the signed-in identity changes (including sign-out).
  const lastUser = useRef<string | null>(null);
  useEffect(() => {
    if (userId === null) return;
    if (lastUser.current !== null && lastUser.current !== userId) { reset(); setOpen(false); }
    lastUser.current = userId;
  }, [userId, reset]);

  useEffect(() => {
    if (!hidden) return;
    if (voiceCallActive || voiceCallStarting) endVoiceCall();
    setOpen(false);
  }, [hidden, voiceCallActive, voiceCallStarting, endVoiceCall]);
  const previousCareMode = useRef(careMode);
  useEffect(() => {
    if (previousCareMode.current !== careMode) {
      previousCareMode.current = careMode;
      reset();
      setOpen(false);
    }
  }, [careMode, reset]);

  useEffect(() => {
    const clampViewportWidth = () => {
      const nextWidth = clampPanelWidth(panelWidthRef.current);
      if (nextWidth === panelWidthRef.current) return;
      panelWidthRef.current = nextWidth;
      setPanelWidth(nextWidth);
      try { window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(nextWidth)); } catch { /* Width still works for this session. */ }
    };
    clampViewportWidth();
    window.addEventListener('resize', clampViewportWidth);
    return () => window.removeEventListener('resize', clampViewportWidth);
  }, []);

  useEffect(() => {
    if (!position || !widgetRef.current) return;
    const clampPosition = () => {
      const current = positionRef.current;
      const widget = widgetRef.current;
      if (!current || !widget) return;
      const rect = widget.getBoundingClientRect();
      const left = Math.min(Math.max(current.left, 8), Math.max(8, window.innerWidth - rect.width - 8));
      const bottom = Math.min(Math.max(current.bottom, 8), Math.max(8, window.innerHeight - rect.height - 8));
      if (left !== current.left || bottom !== current.bottom) {
        const next = { left, bottom };
        updatePosition(next);
        try { window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(next)); } catch { /* Position still works for this session. */ }
      }
    };
    clampPosition();
    window.addEventListener('resize', clampPosition);
    return () => window.removeEventListener('resize', clampPosition);
  }, [position, open, panelWidth, updatePosition]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize || event.pointerId !== resize.pointerId) return;
      updatePanelWidth(resize.startWidth + resize.startX - event.clientX, resize);
    };
    const onEnd = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize || event.pointerId !== resize.pointerId) return;
      resizeRef.current = null;
      setResizing(false);
      persistPanelWidth();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [resizing, updatePanelWidth, persistPanelWidth]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;
      drag.moved = true;
      const rect = widgetRef.current?.getBoundingClientRect();
      const width = rect?.width ?? drag.width;
      const height = rect?.height ?? drag.height;
      const left = Math.min(Math.max(drag.left + event.clientX - drag.startX, 8), Math.max(8, window.innerWidth - width - 8));
      const top = Math.min(Math.max(drag.top + event.clientY - drag.startY, 8), Math.max(8, window.innerHeight - height - 8));
      updatePosition({ left, bottom: window.innerHeight - top - height });
    };
    const onEnd = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      if (!drag.moved) return;
      const next = positionRef.current;
      if (next) {
        try { window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(next)); } catch { /* Position still works for this session. */ }
      }
      if (drag.source === 'launcher') {
        ignoreLauncherClick.current = true;
        window.setTimeout(() => { ignoreLauncherClick.current = false; }, 500);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [dragging, updatePosition]);

  useEffect(() => {
    if (opening) return;
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open, opening]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, error, open]);

  const request = useCallback(async (history: ChatMessage[]) => {
    if (inFlight.current) return;
    const payload = buildPayload(history);
    if (!payload.length || payload[payload.length - 1].role !== 'user') return;
    inFlight.current = true;
    const gen = generation.current;
    setPending(true); setError(null);
    try {
      const res = await mutateRef.current({ data: { messages: payload, includeAccountContext: !careMode && accountAccess === 'granted' } });
      if (!mounted.current || gen !== generation.current) return;
      const reply = (res?.reply ?? '').trim().slice(0, MAX_CONTENT);
      if (!reply) { setError('The guide returned an empty answer. Please retry.'); return; }
      setMessages(prev => [...prev, { id: nextId.current++, role: 'assistant', content: reply }]);
    } catch (err) {
      if (!mounted.current || gen !== generation.current) return;
      setError(readError(err));
    } finally {
      if (mounted.current && gen === generation.current) { setPending(false); inFlight.current = false; }
    }
  }, [accountAccess, careMode]);

  const submitVoice = async (audio: Blob, languageCode: string) => {
    if (audio.size > 12 * 1024 * 1024) {
      inFlight.current = false;
      setVoiceError('That call turn was too long. Please try a shorter sentence.');
      setVoicePending(false);
      resumeVoiceCall();
      return;
    }
    const gen = generation.current;
    const history = messagesRef.current;
    const base = history.length && history[history.length - 1].role === 'user' ? history.slice(0, -1) : history;
    const languageName = supportLanguages.find(language => language.code === languageCode)?.name ?? languageCode;
    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: 'user',
      content: `Spoken call turn · AI reply in ${languageName}.`,
    };
    messagesRef.current = [...base, userMessage];
    setMessages(messagesRef.current);
    setVoicePending(true);
    setVoiceError(null);
    const controller = new AbortController();
    voiceAbortRef.current = controller;
    let audioReplyReady = false;
    try {
      const response = await fetch('/api/resourcebridge/assistant/voice', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-ResourceBridge-Voice-Language': languageCode,
          'X-ResourceBridge-Voice-Context': encodeVoiceContext(base),
        },
        body: audio,
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Voice chat could not answer. Please try again.');
      }
      const result = await response.json() as VoiceReply;
      if (!result.transcript?.trim() || !result.audioBase64 || !result.audioType) {
        throw new Error('The voice reply was incomplete. Please try again.');
      }
      const audioUrl = URL.createObjectURL(audioBlobFromBase64(result.audioBase64, result.audioType));
      if (!mounted.current || gen !== generation.current) {
        URL.revokeObjectURL(audioUrl);
        return;
      }
      audioUrlsRef.current.push(audioUrl);
      const assistantMessage: ChatMessage = {
        id: nextId.current++,
        role: 'assistant',
        content: result.transcript.trim().slice(0, MAX_CONTENT),
        audioUrl,
      };
      audioReplyReady = true;
      setVoiceCallStatus('speaking');
      messagesRef.current = [...messagesRef.current, assistantMessage];
      setMessages(messagesRef.current);
    } catch (err) {
      if (!mounted.current || gen !== generation.current || controller.signal.aborted) return;
      setVoiceError(err instanceof Error ? err.message : 'Voice chat could not answer. Please try again.');
    } finally {
      if (mounted.current && gen === generation.current) {
        setVoicePending(false);
        inFlight.current = false;
        voiceAbortRef.current = null;
        if (!audioReplyReady) resumeVoiceCall();
      }
    }
  };

  const startVoiceCall = async () => {
    if (voiceCallRef.current || voiceCallStarting || inFlight.current) return;
    setVoiceError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || !window.AudioContext) {
      setVoiceError('Voice calls are not supported by this browser.');
      return;
    }
    const gen = generation.current;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    inFlight.current = true;
    setVoiceCallStarting(true);
    setVoiceCallStatus('connecting');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mounted.current || gen !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        inFlight.current = false;
        setVoiceCallStarting(false);
        return;
      }
      context = new AudioContext();
      await context.resume();
      if (!mounted.current || gen !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        void context.close().catch(() => undefined);
        inFlight.current = false;
        setVoiceCallStarting(false);
        return;
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const session: VoiceCallSession = {
        stream,
        context,
        analyser,
        samples: new Float32Array(analyser.fftSize),
        recorder: null,
        chunks: [],
        active: true,
        processing: false,
        speechSince: null,
        lastVoiceAt: 0,
        recordingStartedAt: null,
        rafId: null,
        monitor: null,
        startedAt: Date.now(),
      };
      const monitor = () => {
        if (!session.active) return;
        const now = performance.now();
        if (!session.processing) {
          const voiceDetected = readVoiceLevel(session) > 0.022;
          if (!session.recorder) {
            if (voiceDetected) {
              session.speechSince ??= now;
              if (now - session.speechSince >= 150) {
                try {
                  const supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
                  const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
                    ? supportedTypes.find(type => MediaRecorder.isTypeSupported(type))
                    : undefined;
                  const recorder = new MediaRecorder(stream!, mimeType ? { mimeType } : undefined);
                  session.recorder = recorder;
                  session.chunks = [];
                  session.recordingStartedAt = now;
                  session.lastVoiceAt = now;
                  recorder.ondataavailable = event => {
                    if (event.data.size) session.chunks.push(event.data);
                  };
                  recorder.onerror = () => {
                    session.chunks = [];
                    setVoiceError('Microphone recording failed. Check microphone access and try again.');
                    if (recorder.state === 'recording') recorder.stop();
                  };
                  recorder.onstop = () => {
                    session.recorder = null;
                    session.recordingStartedAt = null;
                    if (!session.active) return;
                    const blob = new Blob(session.chunks, { type: recorder.mimeType || 'audio/webm' });
                    session.chunks = [];
                    if (blob.size < 1000) {
                      session.processing = false;
                      setVoiceCallStatus('listening');
                      return;
                    }
                    session.processing = true;
                    inFlight.current = true;
                    setVoiceCallStatus('thinking');
                    void submitVoice(blob, voiceLanguage);
                  };
                  recorder.start(250);
                  session.speechSince = null;
                } catch {
                  setVoiceError('Could not start microphone capture. End the call and try again.');
                  endVoiceCall();
                }
              }
            } else {
              session.speechSince = null;
            }
          } else {
            if (voiceDetected) session.lastVoiceAt = now;
            const reachedTurnLimit = now - (session.recordingStartedAt ?? now) >= 45_000;
            const heardPause = now - session.lastVoiceAt >= 1000;
            if ((reachedTurnLimit || heardPause) && session.recorder.state === 'recording') {
              session.processing = true;
              session.recorder.stop();
            }
          }
        }
        session.rafId = window.requestAnimationFrame(monitor);
      };
      session.monitor = monitor;
      voiceCallRef.current = session;
      setVoiceCallActive(true);
      setVoiceCallStarting(false);
      setVoiceCallStatus('listening');
      setVoiceCallSeconds(0);
      inFlight.current = false;
      session.rafId = window.requestAnimationFrame(monitor);
    } catch {
      stream?.getTracks().forEach(track => track.stop());
      if (context) void context.close().catch(() => undefined);
      inFlight.current = false;
      setVoiceCallStarting(false);
      setVoiceCallStatus('idle');
      if (gen === generation.current && mounted.current) {
        setVoiceError('Microphone access was not available. Allow microphone access and try again.');
      }
    }
  };

  const send = (raw: string) => {
    const text = raw.trim().slice(0, MAX_CONTENT);
    if (!text || inFlight.current || voiceCallActive || voiceCallStarting || voicePending) return;
    // If the previous user turn failed, replace it so turns stay alternating.
    const base = messages.length && messages[messages.length - 1].role === 'user' ? messages.slice(0, -1) : messages;
    const next: ChatMessage[] = [...base, { id: nextId.current++, role: 'user', content: text }];
    setMessages(next); setDraft('');
    void request(next);
  };

  const retry = () => {
    if (inFlight.current || !messages.length || messages[messages.length - 1].role !== 'user') return;
    void request(messages);
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(draft); };
  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); }
  };
  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (voiceCallActive || voiceCallStarting) endVoiceCall();
      setOpen(false);
    }
  };

  const callMinutes = String(Math.floor(voiceCallSeconds / 60)).padStart(2, '0');
  const callSeconds = String(voiceCallSeconds % 60).padStart(2, '0');
  const callStatusText = voiceCallStarting || voiceCallStatus === 'connecting'
    ? 'Connecting'
    : voiceCallStatus === 'thinking'
      ? 'Jarvis is preparing a reply'
      : voiceCallStatus === 'speaking'
        ? 'Jarvis is speaking'
        : 'Listening — speak naturally';

  if (hidden) return null;
  const canSend = draft.trim().length > 0 && !pending;

  return <div ref={widgetRef} className={`rb-ai ${dragging ? 'is-dragging' : ''} ${resizing ? 'is-resizing' : ''}`} style={position ? { left: `${position.left}px`, bottom: `${position.bottom}px`, right: 'auto' } : undefined}>
    {!!opening && <JarvisOpening key={opening} onStop={finishOpening}/>}
    {open && !opening && <div className="rb-ai-panel" style={{ width: `min(${panelWidth}px, calc(100vw - 24px))` }} role="dialog" aria-modal="false" aria-labelledby={titleId} aria-describedby={noticeId} onKeyDown={onPanelKey} data-testid="panel-ai-assistant">
      <div className="rb-ai-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize AI chat width" aria-valuemin={MIN_PANEL_WIDTH} aria-valuemax={MAX_PANEL_WIDTH} aria-valuenow={panelWidth} aria-valuetext={`${panelWidth} pixels wide`} tabIndex={0} title="Drag left or right to resize" data-resize-hint="Drag ↔ to resize" onPointerDown={beginResize} onKeyDown={onResizeKeyDown} data-testid="handle-ai-resize"/>
      <header className="rb-ai-head" data-drag-hint="Hold Ctrl and click-drag to move" aria-description="Hold Ctrl and click-drag to move this chat." onPointerDown={event => beginDrag(event, 'header')} onContextMenu={event => { if (event.ctrlKey) event.preventDefault(); }}>
        <span className="rb-ai-mark" aria-hidden="true"><JarvisAvatar/></span>
        <div className="rb-ai-titles">
          <span className={`rb-ai-state ${error ? 'needs-retry' : ''}`}><i aria-hidden="true"/>{pending ? 'Preparing your answer' : error ? 'Ready to retry' : 'Your AI companion'}</span>
          <h2 id={titleId}>{assistantName}</h2>
          <small>{careMode ? 'Questions · translation · supportive listening' : accountType === 'owner' ? 'Hosting · requests · customer ratings' : accountType === 'customer' ? 'Finding resources · bookings · owner ratings' : 'General help · optional account help'}</small>
        </div>
        {!careMode && isLoaded && user && accountAccess === 'granted' && <button type="button" className="rb-ai-icon" onClick={revokeAccountAccess} disabled={pending} aria-label="Turn off account access and clear chat" title="Turn off account access and clear chat" data-testid="button-ai-account-header-revoke"><ShieldAlert size={15}/></button>}
        <button type="button" className="rb-ai-icon" onClick={reset} disabled={!messages.length && !error && !draft && !voiceCallStarting && !voiceCallActive && !voicePending && !voiceError} aria-label="Reset conversation" title="Reset conversation" data-testid="button-ai-reset"><RotateCcw size={15}/></button>
        <button type="button" className="rb-ai-icon" onClick={() => { if (voiceCallActive || voiceCallStarting) endVoiceCall(); setOpen(false); }} aria-label="Close assistant" title="Close" data-testid="button-ai-close"><X size={16}/></button>
      </header>
      <p id={noticeId} className="rb-ai-notice" data-testid="text-ai-disclosure" title={careMode ? 'This AI is not a psychiatrist, therapist, or emergency service. It provides supportive listening and general information, not diagnosis or treatment.' : 'AI answers may be wrong. Messages and the role-specific assistant mode are sent to AI. Other account details require explicit permission for account-aware text answers; you can turn it off for this chat. Birth date, gender, exact locations, contact details and passwords are never sent.'}><ShieldAlert size={14} aria-hidden="true"/><span>{careMode ? 'AI may be wrong · Supportive, non-clinical help only.' : 'AI may be wrong · Account access is optional.'}</span></p>
      <div className="rb-ai-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" data-testid="list-ai-messages">
        {careMode && <p className="rb-ai-care-privacy" data-testid="text-ai-care-privacy">Chat and care-help mode go to AI; no account records or tickets are attached.</p>}
        {(voiceCallActive || voiceCallStarting) && <div className={`rb-ai-call-card ${voiceCallStatus}`} aria-label="AI voice call" data-testid="panel-ai-call">
          <div className="rb-ai-call-avatar" aria-hidden="true"><JarvisAvatar/></div>
          <strong>Jarvis</strong>
          <span role="status" aria-live="polite">{callStatusText}</span>
          <small aria-live="off">{callMinutes}:{callSeconds}</small>
          <div className={`rb-ai-call-wave ${voiceCallStatus}`} aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
          <p>Speak naturally; the AI listens again after each reply.</p>
          <button type="button" onClick={endVoiceCall} data-testid="button-ai-end-call"><PhoneOff size={15}/> End call</button>
        </div>}
        {!careMode && isLoaded && user && <div className={`rb-ai-consent ${accountAccess === 'granted' ? 'is-granted' : ''}`} role="group" aria-label="Account-aware answers" data-testid="panel-ai-account-consent">
          <div className="rb-ai-consent-copy">
            <strong>{accountAccess === 'granted' ? 'Account-aware help is on' : accountAccess === 'denied' ? 'Account details stay private' : 'Allow account-aware answers?'}</strong>
            <span className={accountAccess !== 'undecided' ? 'rb-ai-consent-single-line' : undefined} title={accountAccess === 'granted'
              ? 'Your name, city/region, account type, listings, bookings and ratings are sent with text questions in this chat. Calls share audio and recent conversation, without fetching additional account records. Birth date, gender, exact addresses, contact details and passwords stay private. Turning this off clears the chat and ends any call.'
              : accountAccess === 'denied'
                ? 'Your messages and role-specific help mode are shared. Other account details stay private unless you allow account-aware text answers.'
                : undefined}>{accountAccess === 'granted'
              ? 'Account summary in text chat · turn off clears chat.'
              : accountAccess === 'denied'
                ? 'Chat & help mode shared; Allow adds account summary.'
              : 'Share your name, city/region, account type, listings, bookings and ratings for account-aware text answers. Birth date, gender, exact addresses, contact details and passwords are never shared.'}</span>
          </div>
          {accountAccess === 'granted'
            ? <button type="button" className="rb-ai-consent-button secondary" onClick={revokeAccountAccess} disabled={pending} data-testid="button-ai-account-revoke">Turn off</button>
            : <div className="rb-ai-consent-actions">
                <button type="button" className="rb-ai-consent-button primary" onClick={() => setAccountAccess('granted')} disabled={pending || voiceCallStarting || voiceCallActive || voicePending} aria-label="Allow the AI to access your account for this chat" title="Allow the AI to access your account for this chat" data-testid="button-ai-account-grant">Allow account access</button>
                {accountAccess === 'undecided' && <button type="button" className="rb-ai-consent-button secondary" onClick={() => setAccountAccess('denied')} disabled={pending || voiceCallStarting || voiceCallActive || voicePending} data-testid="button-ai-account-deny">No thanks</button>}
              </div>}
        </div>}
        {!messages.length && <div className="rb-ai-empty">
          <div className="rb-ai-welcome-avatar" aria-hidden="true"><JarvisAvatar/></div>
          <strong>{careMode ? 'How can I support your work?' : accountType === 'owner' ? 'How can I help with your resources?' : accountType === 'customer' ? 'How can I help you find or book?' : 'How can I help you share or book?'}</strong>
          <span>{careMode ? 'Ask a question, translate a message, or talk something through.' : 'Pick a starting point or ask your own question.'}</span>
          <div className="rb-ai-suggestions">{suggestions.map((s, i) => <button key={s} type="button" onClick={() => send(s)} disabled={pending || voiceCallStarting || voiceCallActive || voicePending} data-testid={`button-ai-suggestion-${i}`}>{s}</button>)}</div>
        </div>}
        {messages.map(m => <div key={m.id} className={`rb-ai-msg ${m.role}`} data-testid={`text-ai-message-${m.id}`}>
          <span className="rb-ai-sr">{m.role === 'user' ? 'You said:' : `${assistantName} replied:`}</span>{m.content}
          {m.audioUrl && <audio
            ref={voiceCallActive ? replyAudioRef : undefined}
            className="rb-ai-audio"
            controls
            autoPlay={voiceCallActive}
            preload="auto"
            src={m.audioUrl}
            aria-label="Play the AI voice reply"
            onCanPlay={event => {
              if (voiceCallRef.current?.active && voiceCallStatus === 'speaking') {
                void event.currentTarget.play().catch(() => {
                  setVoiceError('Tap play to hear the AI reply. The call is still listening.');
                  resumeVoiceCall();
                });
              }
            }}
            onPlay={() => {
              const session = voiceCallRef.current;
              if (session?.active) {
                session.processing = true;
                setVoiceCallStatus('speaking');
              }
            }}
            onEnded={resumeVoiceCall}
            onError={() => {
              if (voiceCallRef.current?.active) {
                setVoiceError('Audio playback failed. The call is still listening.');
                resumeVoiceCall();
              }
            }}
          />}
        </div>)}
        {(pending || voicePending) && <div className="rb-ai-msg assistant rb-ai-typing" role="status" data-testid="status-ai-typing"><span className="rb-ai-sr">{voicePending ? 'Jarvis is preparing a spoken reply' : `${assistantName} is writing a reply`}</span><i/><i/><i/></div>}
        {error && <div className="rb-ai-error" role="alert" data-testid="status-ai-error"><span>{error}</span><button type="button" onClick={retry} disabled={pending} data-testid="button-ai-retry"><RotateCcw size={13}/> Retry</button></div>}
        {voiceError && <div className="rb-ai-voice-error" role="alert" data-testid="status-ai-voice-error">{voiceError}</div>}
      </div>
      <form className="rb-ai-form" onSubmit={onSubmit}>
        <label htmlFor={`${titleId}-input`} className="rb-ai-sr">Message {assistantName}</label>
        <div className="rb-ai-voice-tools">
          {canUseVoice && <>
            <label htmlFor={`${titleId}-voice-language`}>AI speaks</label>
            <select id={`${titleId}-voice-language`} value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value)} disabled={voiceCallStarting || voiceCallActive || voicePending} aria-label="Choose the AI voice reply language" data-testid="select-ai-voice-language">
              {supportLanguages.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
            </select>
          </>}
          {!voiceCallActive && <button type="button" className="rb-ai-call-start" onClick={() => {
            if (!canUseVoice) {
              navigate(user ? '/account-type' : '/sign-in');
              return;
            }
            void startVoiceCall();
          }} disabled={!isLoaded || (canUseVoice && (pending || voicePending || voiceCallStarting || inFlight.current))} aria-label={canUseVoice ? 'Start a live voice call with Jarvis' : user ? 'Choose an account type to call Jarvis' : 'Sign in to call Jarvis'} data-testid={canUseVoice ? 'button-ai-voice' : 'button-ai-voice-sign-in'}>
            <Phone size={14}/>{!isLoaded ? 'Loading…' : canUseVoice ? (voiceCallStarting ? 'Connecting…' : 'Call Jarvis') : user ? 'Choose account to call' : 'Sign in to call Jarvis'}
          </button>}
        </div>
        <textarea id={`${titleId}-input`} ref={inputRef} value={draft} maxLength={MAX_CONTENT} rows={2} onChange={e => setDraft(e.target.value.slice(0, MAX_CONTENT))} onKeyDown={onInputKey} placeholder={careMode ? 'Ask, translate, or talk something through…' : accountType === 'owner' ? 'Ask about your listings, requests, returns or ratings' : accountType === 'customer' ? 'Ask about finding resources, bookings, returns or ratings' : 'Ask about finding, booking, hosting or ratings'} disabled={voiceCallStarting || voiceCallActive || voicePending} data-testid="input-ai-message"/>
        {canUseVoice && <small className="rb-ai-voice-privacy">Calls share audio and recent chat with AI; audio isn’t saved.</small>}
        <div className="rb-ai-form-foot">
          <small aria-live="off">{draft.length}/{MAX_CONTENT} · Enter to send, Shift+Enter for a new line</small>
          <button type="submit" disabled={!canSend || voiceCallStarting || voiceCallActive || voicePending} aria-label="Send message" data-testid="button-ai-send"><Send size={15}/></button>
        </div>
      </form>
    </div>}
    <button ref={launcherRef} type="button" className={`rb-ai-launcher ${open && !opening ? 'is-open' : ''}`} data-drag-hint="Hold Ctrl and click-drag to move" aria-description="Hold Ctrl and click-drag to move this chat." onPointerDown={event => beginDrag(event, 'launcher')} onContextMenu={event => { if (event.ctrlKey) event.preventDefault(); }} onClick={event => { if (ignoreLauncherClick.current) { ignoreLauncherClick.current = false; event.preventDefault(); return; } if (opening) { finishOpening(); return; } if (open && (voiceCallActive || voiceCallStarting)) endVoiceCall(); if (!open) beginOpening(); else finishOpening(); setOpen(o => !o); }} aria-expanded={open && !opening} aria-label={opening ? 'Skip Jarvis animation and open chat' : open ? 'Close AI chat' : `Open ${assistantName}`} data-testid="button-ai-launcher">
      {open && !opening ? <X size={20}/> : <JarvisHome/>}<span className="rb-ai-launcher-label">{opening ? 'Jarvis' : open ? 'Close' : assistantName === 'Jarvis' ? 'Jarvis' : 'Ask the guide'}</span>
    </button>
  </div>;
}

export default AIAssistant;
