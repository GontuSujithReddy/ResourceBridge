import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { Check, Copy, Headset, Inbox, Languages, Plus, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react';
import {
  useGetResourceBridgeSupportAccess, getGetResourceBridgeSupportAccessQueryKey,
  useListResourceBridgeSupportTickets, getListResourceBridgeSupportTicketsQueryKey,
  useListResourceBridgeSupportQueue, getListResourceBridgeSupportQueueQueryKey,
  useCreateResourceBridgeSupportTicket, useClaimResourceBridgeSupportTicket,
  useReplyResourceBridgeSupportTicket, useResolveResourceBridgeSupportTicket,
  useGetResourceBridgeProfile, getGetResourceBridgeProfileQueryKey,
  useTranslateResourceBridgeSupportText,
} from '@workspace/api-client-react';
import type { ResourceBridgeSupportTicket } from '@workspace/api-client-react';
import './support-desk.css';

type Mode = 'queue' | 'mine';
type Filter = 'all' | 'unassigned' | 'mine';

function errMsg(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const d = (error as { data: unknown }).data;
    if (typeof d === 'object' && d !== null && 'error' in d && typeof (d as { error: unknown }).error === 'string') return (d as { error: string }).error;
  }
  return fallback;
}
function errStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status: unknown }).status) : 0;
}
const fmt = (s: string) => new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function SupportDesk() {
  const { user } = useUser();
  const uid = user?.id ?? '';
  const qc = useQueryClient();
  const profile = useGetResourceBridgeProfile({ query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: !!uid } });
  const isCareAccount = profile.data?.profile?.accountType === 'customer_care';
  const access = useGetResourceBridgeSupportAccess({ query: { queryKey: getGetResourceBridgeSupportAccessQueryKey(), enabled: !!uid, refetchInterval: 15000 } });
  const isAgent = access.data?.approved === true;
  const own = useListResourceBridgeSupportTickets({ query: { queryKey: getListResourceBridgeSupportTicketsQueryKey(), enabled: !!uid && !!profile.data?.profile?.accountType && !isCareAccount, refetchInterval: 15000 } });
  const queue = useListResourceBridgeSupportQueue({ query: { queryKey: getListResourceBridgeSupportQueueQueryKey(), enabled: isAgent, refetchInterval: 15000 } });
  const create = useCreateResourceBridgeSupportTicket();
  const claim = useClaimResourceBridgeSupportTicket();
  const reply = useReplyResourceBridgeSupportTicket();
  const resolve = useResolveResourceBridgeSupportTicket();

  const mode: Mode = isCareAccount ? 'queue' : 'mine';
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const refreshAll = () => Promise.all([
    qc.invalidateQueries({ queryKey: getListResourceBridgeSupportTicketsQueryKey() }),
    qc.invalidateQueries({ queryKey: getListResourceBridgeSupportQueueQueryKey() }),
  ]);

  const activeQuery = mode === 'queue' ? queue : own;
  const list: ResourceBridgeSupportTicket[] = useMemo(() => {
    const rows = activeQuery.data ?? [];
    if (mode !== 'queue') return rows;
    if (filter === 'unassigned') return rows.filter(t => !t.assignedAgentId && t.status === 'open');
    if (filter === 'mine') return rows.filter(t => t.assignedAgentId === uid);
    return rows;
  }, [activeQuery.data, mode, filter, uid]);

  useEffect(() => {
    if (composing) return;
    if (selectedId === null || !list.some(t => t.id === selectedId)) setSelectedId(list[0]?.id ?? null);
  }, [list, selectedId, composing]);
  useEffect(() => { setDraft(''); setError(''); }, [selectedId]);

  const ticket = list.find(t => t.id === selectedId) ?? null;
  const isRequester = !!ticket && ticket.requesterId === uid;
  const isAssignedAgent = !!ticket && isAgent && !isRequester && ticket.assignedAgentId === uid;
  const canTake = !!ticket && isAgent && mode === 'queue' && !isRequester && ticket.status === 'open' && !ticket.assignedAgentId;
  const canReply = !!ticket && ticket.status === 'open' && (isRequester || isAssignedAgent);
  const canResolve = !!ticket && isAssignedAgent && ticket.status === 'open';
  const myRole = isRequester ? 'member' : 'agent';

  const submitTicket = (e: FormEvent) => {
    e.preventDefault(); setError('');
    create.mutate({ data: { subject: subject.trim(), message: body.trim() } }, {
      onSuccess: t => {
        qc.setQueryData<ResourceBridgeSupportTicket[]>(getListResourceBridgeSupportTicketsQueryKey(), current => [t, ...(current ?? []).filter(item => item.id !== t.id)]);
        setSubject(''); setBody(''); setComposing(false); setSelectedId(t.id); void refreshAll();
      },
      onError: err => setError(errMsg(err, 'Your ticket could not be submitted.')),
    });
  };
  const take = () => {
    if (!ticket) return; setError('');
    claim.mutate({ id: ticket.id }, {
      onSuccess: () => void refreshAll(),
      onError: err => { setError(errStatus(err) === 409 ? 'Another agent took this ticket first. The queue has been refreshed.' : errMsg(err, 'Could not take this ticket.')); void refreshAll(); },
    });
  };
  const send = (e: FormEvent) => {
    e.preventDefault(); if (!ticket || !draft.trim()) return; setError('');
    reply.mutate({ id: ticket.id, data: { message: draft.trim() } }, {
      onSuccess: () => { setDraft(''); void refreshAll(); },
      onError: err => { setError(errMsg(err, 'Your reply was not sent.')); void refreshAll(); },
    });
  };
  const confirmResolved = () => {
    if (!ticket) return; setError('');
    resolve.mutate({ id: ticket.id }, {
      onSuccess: () => void refreshAll(),
      onError: err => { setError(errMsg(err, 'Could not mark this ticket resolved.')); void refreshAll(); },
    });
  };

  const openCount = (activeQuery.data ?? []).filter(t => t.status === 'open').length;
  const unassignedCount = (queue.data ?? []).filter(t => !t.assignedAgentId && t.status === 'open').length;

  if (profile.isLoading || access.isLoading) return <div className="sd" data-testid="status-loading">{[0, 1, 2].map(i => <div className="sd-skel" key={i} />)}</div>;
  if (profile.isError) return <div className="sd-panel sd-empty" data-testid="status-profile-error"><h3>Account type could not be checked</h3><p>Support access remains unchanged.</p><button className="rb-btn" onClick={() => void profile.refetch()} data-testid="button-retry-profile">Try again</button></div>;
  if (access.isError) return <div className="sd-panel sd-empty" data-testid="status-error"><h3>Support access could not be checked</h3><p>Nothing was changed.</p><button className="rb-btn" onClick={() => void access.refetch()} data-testid="button-retry-access">Try again</button></div>;

  return <div className="sd">
    <div className="sd-head">
      <div className="sd-title">
        <SupportAgentIllustration />
        <div>
          <div className="sd-eyebrow">{isAgent ? 'Approved care team / shared queue' : isCareAccount ? 'Customer care / agent access' : 'Help centre / your conversations'}</div>
          <h1>{isCareAccount ? 'Customer care' : 'Customer service'}</h1>
          <p>{isAgent ? 'Pick up an open case, support the member, and resolve it when it is handled.' : isCareAccount ? 'Your agent workspace and access status.' : 'Raise a request for the ResourceBridge care team and follow the conversation.'}</p>
        </div>
      </div>
      <div className="sd-counter" data-testid="text-open-count"><strong>{openCount}</strong><span>Open tickets<br />{mode === 'queue' ? `${unassignedCount} waiting` : 'in your inbox'}</span></div>
    </div>

    {isCareAccount && !isAgent && <div className="sd-notice" role="status" aria-label={access.data?.status === 'rejected' ? 'Care team access not approved. Contact the workspace administrator.' : 'Customer-care access is awaiting approval. The shared ticket queue appears after approval. Care team AI is available now.'} data-testid={access.data?.status === 'rejected' ? 'status-care-rejected' : 'status-care-pending'}><ShieldCheck size={18} /><span className="sd-notice-line" title={access.data?.status === 'rejected' ? 'Care team access not approved. Contact the workspace administrator.' : 'Customer-care access is awaiting approval. The shared ticket queue appears after approval. Care team AI is available now.'}>{access.data?.status === 'rejected' ? 'Care access not approved — contact your workspace administrator.' : 'Care access pending — queue unlocks after approval. AI chat is available now.'}</span></div>}
    {!isCareAccount && access.data?.status === 'pending' && <div className="sd-notice" role="status" aria-label="Your customer care request is being reviewed. The shared queue unlocks once it is approved." data-testid="status-care-pending"><ShieldCheck size={18} /><span className="sd-notice-line" title="Your customer care request is being reviewed. The shared queue unlocks once it is approved.">Care team approval is pending — shared queue unlocks after approval.</span></div>}
    {!isCareAccount && access.data?.status === 'rejected' && <div className="sd-notice" role="status" aria-label="Care team access was not approved. You can still submit and follow your own support tickets." data-testid="status-care-rejected"><ShieldCheck size={18} /><span className="sd-notice-line" title="Care team access was not approved. You can still submit and follow your own support tickets.">Care access not approved — you can still manage your support tickets.</span></div>}

    <div className="sd-bar">
      <span className="sd-meta" data-testid="text-ticket-total">{list.length} {mode === 'queue' ? 'cases in shared queue' : 'of your tickets'}</span>
      <div className="sd-tools">
        {mode === 'queue' && <div className="sd-seg" role="group" aria-label="Queue filter">
          {(['all', 'unassigned', 'mine'] as Filter[]).map(f => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} data-testid={`button-filter-${f}`}>{f === 'all' ? 'All' : f === 'unassigned' ? 'Unassigned' : 'Mine'}</button>)}
        </div>}
        <button className="rb-btn" onClick={() => void refreshAll()} data-testid="button-refresh"><RefreshCw size={14} />Refresh</button>
        {mode === 'mine' && !isCareAccount && <button className="rb-btn primary" onClick={() => { setComposing(true); setError(''); }} data-testid="button-new-ticket"><Plus size={14} />Raise a request</button>}
      </div>
    </div>

    <div className="sd-grid">
      <section className="sd-panel" aria-label="Tickets">
        <div className="sd-panel-head"><span>{mode === 'queue' ? 'Ticket queue' : 'Your tickets'}</span><span className="sd-meta">{list.length} shown</span></div>
        {activeQuery.isLoading ? [0, 1, 2].map(i => <div className="sd-skel" key={i} />)
          : activeQuery.isError ? <div className="sd-empty" data-testid="status-list-error"><h3>Tickets could not load</h3><button className="rb-btn" onClick={() => void activeQuery.refetch()} data-testid="button-retry-list">Try again</button></div>
          : list.length === 0 ? <div className="sd-empty" data-testid="status-list-empty"><Inbox size={22} /><h3>{mode === 'queue' ? isAgent ? 'Queue is clear' : 'Agent workspace locked' : 'No requests yet'}</h3><p>{mode === 'queue' ? isAgent ? 'No cases match this filter right now.' : 'The shared ticket queue will be available when your care access is approved.' : 'Raise a request whenever you need a hand.'}</p></div>
          : <div className="sd-list">{list.map(t => <button key={t.id} className="sd-item" aria-current={t.id === selectedId && !composing} onClick={() => { setComposing(false); setSelectedId(t.id); }} data-testid={`button-ticket-${t.id}`}>
            <span className="sd-item-top"><span className="sd-id">RB-{t.id}</span><span className={`sd-pill ${t.status}`}>{t.status}</span></span>
            <strong>{t.subject}</strong>
            <small>{mode === 'queue' ? `${t.requesterName} · ` : ''}{t.assignedAgentName ? `Assigned: ${t.assignedAgentName}` : 'Unassigned'} · {fmt(t.createdAt)}</small>
          </button>)}</div>}
      </section>

      <section className="sd-panel" aria-label="Ticket detail" aria-live="polite">
        {isAgent && <CustomerCareTranslationAssistant draft={draft} onDraftChange={setDraft} canUseReply={isAssignedAgent && ticket?.status === 'open'} />}
        {composing ? <form className="sd-form" onSubmit={submitTicket}>
          <div className="sd-panel-head" style={{ margin: '-18px -18px 0' }}><span>New support ticket</span></div>
          <label>Subject<input className="rb-input" value={subject} onChange={e => setSubject(e.target.value)} minLength={2} maxLength={160} required data-testid="input-ticket-subject" /></label>
          <label>How can we help?<textarea className="rb-textarea" value={body} onChange={e => setBody(e.target.value)} maxLength={4000} required data-testid="input-ticket-message" /></label>
          {error && <div className="sd-err" role="alert" data-testid="status-error-message">{error}</div>}
          <div className="sd-actions">
            <button type="button" className="rb-btn" onClick={() => setComposing(false)} data-testid="button-cancel-ticket">Cancel</button>
            <button type="submit" className="rb-btn primary" disabled={create.isPending || subject.trim().length < 2 || !body.trim()} data-testid="button-submit-ticket">{create.isPending ? 'Submitting' : 'Submit ticket'}</button>
          </div>
        </form>
          : !ticket ? <div className="sd-empty" data-testid="status-no-selection"><Headset size={22} /><h3>Select a ticket</h3><p>Choose a conversation to read the thread.</p></div>
          : <>
            <div className="sd-thread-head">
              <div><span className="sd-id">Ticket RB-{ticket.id}</span><h2 data-testid="text-ticket-subject">{ticket.subject}</h2><small>Opened {fmt(ticket.createdAt)}{!isRequester ? ` by ${ticket.requesterName}` : ''}</small></div>
              <span className={`sd-pill ${ticket.status}`} data-testid="status-ticket">{ticket.status}</span>
            </div>
            <div className="sd-assign" data-testid="text-assignment">
              <span className="sd-mark"><UserRound size={15} /></span>
              <div>{ticket.assignedAgentId ? <><strong>Assigned to {ticket.assignedAgentId === uid && !isRequester ? 'you' : ticket.assignedAgentName ?? 'a care agent'}</strong><small>ResourceBridge care team</small></> : <><strong>Waiting for an agent</strong><small>The next available agent will take this case.</small></>}</div>
            </div>
            <div className="sd-msgs">
              {ticket.messages.map(m => <div key={m.id} className={`sd-msg ${m.senderRole === myRole ? 'mine' : ''}`} data-testid={`text-message-${m.id}`}>
                <span className="sd-msg-meta">{m.senderRole === 'agent' ? 'Care agent' : isRequester ? 'You' : ticket.requesterName} · {fmt(m.createdAt)}</span>{m.message}
              </div>)}
            </div>
            <div className="sd-foot">
              {error && <div className="sd-err" role="alert" data-testid="status-error-message">{error}</div>}
              {canTake && <div className="sd-actions"><span className="sd-note" style={{ marginRight: 'auto' }}>This case is unassigned. Take it to reply.</span><button className="rb-btn primary" onClick={take} disabled={claim.isPending} data-testid="button-take-ticket">{claim.isPending ? 'Taking' : 'Take ticket'}</button></div>}
              {canReply && <form onSubmit={send} style={{ display: 'grid', gap: 8 }}>
                <label className="sd-note" htmlFor="sd-reply">Reply</label>
                <textarea id="sd-reply" className="rb-textarea" style={{ minHeight: 80 }} value={draft} onChange={e => setDraft(e.target.value)} maxLength={4000} data-testid="input-reply" />
                <div className="sd-actions">
                  {canResolve && <button type="button" className="rb-btn" onClick={confirmResolved} disabled={resolve.isPending} data-testid="button-resolve-ticket">{resolve.isPending ? 'Saving' : 'Resolve ticket'}</button>}
                  <button type="submit" className="rb-btn primary" disabled={reply.isPending || !draft.trim()} data-testid="button-send-reply">{reply.isPending ? 'Sending' : 'Send reply'}</button>
                </div>
              </form>}
              {ticket.status === 'resolved' && <p className="sd-note" data-testid="text-resolved-note">This ticket was resolved by the care team. The thread is read-only.</p>}
              {ticket.status === 'open' && !canReply && !canTake && <p className="sd-note" data-testid="text-readonly-note">{isRequester ? '' : ticket.assignedAgentId ? 'This ticket belongs to its assigned agent. You can read the thread but cannot reply or change its status.' : 'You cannot act on this ticket.'}</p>}
              {isRequester && ticket.status === 'open' && !ticket.assignedAgentId && <p className="sd-note">A care agent will review and resolve this request.</p>}
            </div>
          </>}
      </section>
    </div>
  </div>;
}

const ISO_LANGUAGE_CODES = `aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu`.split(' ');
const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' });
const supportLanguages = ISO_LANGUAGE_CODES.map(code => ({
  code,
  name: languageDisplayNames.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name));

function CustomerCareTranslationAssistant({ draft, onDraftChange, canUseReply }: {
  draft: string;
  onDraftChange: (value: string) => void;
  canUseReply: boolean;
}) {
  const translate = useTranslateResourceBridgeSupportText();
  const [tool, setTool] = useState<'incoming' | 'reply'>('incoming');
  const [incomingText, setIncomingText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [languageSearch, setLanguageSearch] = useState('');
  const [appliedLanguageSearch, setAppliedLanguageSearch] = useState('');
  const [incomingResult, setIncomingResult] = useState<{ detectedLanguage: string; translatedText: string } | null>(null);
  const [replyResult, setReplyResult] = useState<{ detectedLanguage: string; translatedText: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filteredLanguages = supportLanguages.filter(language =>
    language.name.toLowerCase().includes(appliedLanguageSearch.trim().toLowerCase()) ||
    language.code.toLowerCase().includes(appliedLanguageSearch.trim().toLowerCase()),
  );
  const selectedLanguage = supportLanguages.find(language => language.code === targetLanguage) ?? {
    code: targetLanguage,
    name: targetLanguage.startsWith('custom:') ? targetLanguage.slice('custom:'.length) : 'English',
  };

  useEffect(() => {
    if (!canUseReply && tool === 'reply') setTool('incoming');
  }, [canUseReply, tool]);

  const runTranslation = (kind: 'incoming' | 'reply', text: string) => {
    if (!text.trim() || !selectedLanguage) return;
    setError('');
    setNotice('');
    if (kind === 'incoming') setIncomingResult(null);
    else setReplyResult(null);
    translate.mutate({ data: { text: text.trim(), targetLanguage: selectedLanguage.name } }, {
      onSuccess: result => {
        if (kind === 'incoming') setIncomingResult(result);
        else setReplyResult(result);
      },
      onError: err => setError(errMsg(err, 'Could not translate this text. Please try again.')),
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Translation copied.');
    } catch {
      setError('Clipboard access is unavailable. Select and copy the translation manually.');
    }
  };

  return <section className="sd-translator" aria-label="Customer-care translation helper" data-testid="panel-support-translation">
    <div className="sd-translator-heading">
      <span className="sd-mark"><Languages size={18}/></span>
      <div><strong>Translation chatbot</strong><small>Detect the language and prepare a reply.</small></div>
    </div>
    <div className="sd-seg sd-translator-tabs" role="group" aria-label="Translation task">
      <button type="button" aria-pressed={tool === 'incoming'} onClick={() => { setTool('incoming'); setError(''); }} data-testid="button-translate-incoming">Understand a message</button>
      <button type="button" aria-pressed={tool === 'reply'} disabled={!canUseReply} onClick={() => { setTool('reply'); setError(''); }} data-testid="button-translate-reply">Translate a reply</button>
    </div>
    <label className="sd-translator-field">
      {tool === 'incoming' ? 'Paste the customer message' : 'Write your solution'}
      <textarea
        className="rb-textarea"
        value={tool === 'incoming' ? incomingText : solutionText}
        onChange={event => {
          if (tool === 'incoming') { setIncomingText(event.target.value); setIncomingResult(null); }
          else { setSolutionText(event.target.value); setReplyResult(null); }
          setError(''); setNotice('');
        }}
        maxLength={4000}
        placeholder={tool === 'incoming' ? 'Paste only the message you need translated…' : 'Write the solution you want to send…'}
        data-testid={tool === 'incoming' ? 'input-translate-incoming' : 'input-translate-solution'}
      />
    </label>
    <div className="sd-language-picker">
      <label className="sd-translator-field" htmlFor="sd-language-search">Search languages</label>
      <div className="sd-language-controls">
        <div className="sd-language-search"><Search size={15}/><input id="sd-language-search" className="rb-input" type="search" value={languageSearch} onChange={event => setLanguageSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') setAppliedLanguageSearch(languageSearch); }} placeholder="Search by language name" data-testid="input-language-search"/><button type="button" className="rb-btn" onClick={() => setAppliedLanguageSearch(languageSearch)} data-testid="button-search-language">Search</button></div>
        <select className="rb-select" value={targetLanguage} onChange={event => setTargetLanguage(event.target.value)} aria-label="Translate into language" data-testid="select-translation-language">
          {filteredLanguages.length === 0
            ? <>
              <option value={targetLanguage}>{selectedLanguage.name} · selected</option>
              {appliedLanguageSearch.trim() && targetLanguage !== `custom:${appliedLanguageSearch.trim()}` && <option value={`custom:${appliedLanguageSearch.trim()}`}>Use “{appliedLanguageSearch.trim()}”</option>}
            </>
            : <>
              {!filteredLanguages.some(language => language.code === targetLanguage) && <option value={targetLanguage}>{selectedLanguage.name} · selected</option>}
              {filteredLanguages.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
            </>}
        </select>
      </div>
      <small className="sd-note">The list includes standard two-letter language codes. Search for a custom language name if yours is not listed.</small>
    </div>
    <div className="sd-actions">
      <button type="button" className="rb-btn primary" onClick={() => runTranslation(tool, tool === 'incoming' ? incomingText : solutionText)} disabled={translate.isPending || !(tool === 'incoming' ? incomingText.trim() : solutionText.trim())} data-testid="button-run-translation">
        <Languages size={14}/>{translate.isPending ? 'Translating…' : tool === 'incoming' ? 'Detect language & translate' : `Translate to ${selectedLanguage.name}`}
      </button>
    </div>
    {error && <div className="sd-err" role="alert" data-testid="status-translation-error">{error}</div>}
    {notice && <div className="sd-note" role="status" data-testid="status-translation-notice">{notice}</div>}
    {tool === 'incoming' && incomingResult && <div className="sd-translation-result" data-testid="panel-incoming-translation">
      <div className="sd-translation-result-head"><span>Detected language: <strong data-testid="text-detected-language">{incomingResult.detectedLanguage}</strong></span><button type="button" className="rb-btn" onClick={() => void copyText(incomingResult.translatedText)} data-testid="button-copy-incoming-translation"><Copy size={14}/>Copy meaning</button></div>
      <p>{incomingResult.translatedText}</p>
    </div>}
    {tool === 'reply' && replyResult && <div className="sd-translation-result" data-testid="panel-reply-translation">
      <div className="sd-translation-result-head"><span>Detected draft language: <strong>{replyResult.detectedLanguage}</strong> · {selectedLanguage.name}</span><button type="button" className="rb-btn" disabled={replyResult.translatedText.length > 4000} onClick={() => { onDraftChange(replyResult.translatedText); setNotice('Translated reply added to the ticket draft. Review it before sending.'); }} data-testid="button-use-translated-reply"><Check size={14}/>{replyResult.translatedText.length > 4000 ? 'Over reply limit' : 'Use translated reply'}</button></div>
      <p>{replyResult.translatedText}</p>
      {replyResult.translatedText.length > 4000 && <small className="sd-note">This translation exceeds the 4,000-character reply limit. Shorten the solution and translate it again.</small>}
    </div>}
    <p className="sd-translation-privacy">Only text you paste or type here is sent for translation. It isn’t stored by this tool. Review translations before sending.</p>
  </section>;
}

function SupportAgentIllustration() {
  return <svg className="sd-agent-illustration" viewBox="0 0 120 110" role="img" aria-labelledby="sd-agent-title">
    <title id="sd-agent-title">Customer care person wearing a headset with a microphone</title>
    <circle cx="59" cy="48" r="27" fill="#f0c7aa"/>
    <path d="M32 47c1-19 12-31 28-31 17 0 29 13 28 31-7-4-12-11-15-18-10 9-24 14-41 14z" fill="#263b55"/>
    <path d="M27 108c2-22 14-34 32-34s30 12 33 34" fill="#3368bf"/>
    <path d="M34 49a25 25 0 0 1 50 0" fill="none" stroke="#18375f" strokeWidth="7" strokeLinecap="round"/>
    <rect x="27" y="43" width="13" height="25" rx="6.5" fill="#3368bf" stroke="#18375f" strokeWidth="2"/>
    <rect x="78" y="43" width="13" height="25" rx="6.5" fill="#3368bf" stroke="#18375f" strokeWidth="2"/>
    <path d="M84 66c0-5-5-8-11-7" fill="none" stroke="#18375f" strokeWidth="3.5" strokeLinecap="round"/>
    <rect x="67" y="56" width="11" height="7" rx="3.5" fill="#18375f"/>
    <circle cx="50" cy="50" r="2" fill="#263b55"/>
    <path d="M50 62c5 4 11 4 16 0" fill="none" stroke="#a95457" strokeWidth="2" strokeLinecap="round"/>
    <path d="M44 74v9m30-9v9" stroke="#f0c7aa" strokeWidth="7" strokeLinecap="round"/>
  </svg>;
}

export default SupportDesk;
