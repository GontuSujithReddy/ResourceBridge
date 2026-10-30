import { Fragment, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Bike, BookOpen, Boxes, Building2, CookingPot, Dumbbell, House, Laptop, Palette, Wrench } from 'lucide-react';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Compass, Drill, FlaskConical, GraduationCap, Hammer, MapPin, Menu, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Star, UsersRound, Volume2, VolumeX, X } from 'lucide-react';
import {
  useListResourceBridgeResources, useCreateResourceBridgeResource, useGetResourceBridgeResource,
  useUpdateResourceBridgeResource,
  useListMyResourceBridgeResources, useGetResourceBridgeDashboard, useListResourceBridgeBookings,
  useCreateResourceBridgeBooking, useDecideResourceBridgeBooking, useCheckInResourceBridgeBooking,
  useSubmitResourceBridgeReturn, useConfirmResourceBridgeReturn,
  useGetResourceBridgeMyRatings, useRateResourceBridgeBooking, useSaveResourceBridgeProfileDetails,
  useGetResourceBridgeProfile, useSetResourceBridgeProfile, getGetResourceBridgeProfileQueryKey,
  getGetResourceBridgeMyRatingsQueryKey,
  getListMyResourceBridgeOrganizationsQueryKey,
  getListResourceBridgeResourcesQueryKey, getListMyResourceBridgeResourcesQueryKey,
  useListMyResourceBridgeOrganizations,
  useListResourceBridgeOrganizations,
  useRequestResourceBridgePhotoUploadUrl,
  getGetResourceBridgeDashboardQueryKey, getListResourceBridgeBookingsQueryKey,
  getGetResourceBridgeResourceQueryKey,
} from '@workspace/api-client-react';
import type { ResourceBridgeResource, ResourceBridgeBooking } from '@workspace/api-client-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useRoute } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { RatingStarAnimation } from '@/components/rating-star';
import { AIAssistant } from '@/components/ai-assistant';
import { CommunityPulseDashboard } from '@/components/community-pulse-dashboard';
import { PageLoadingState } from '@/components/page-loading-state';
import { BookingNavigationAnimation } from '@/components/booking-navigation-animation';
import { OrganizationNavigationAnimation } from '@/components/organization-navigation-animation';
import { OverviewNavigationAnimation } from '@/components/overview-navigation-animation';
import { ExploreNavigationAnimation } from '@/components/explore-navigation-animation';
import { SupportNavigationAnimation } from '@/components/support-navigation-animation';
import { ProfileNavigationAnimation } from '@/components/profile-navigation-animation';
import { GuideNavigationAnimation } from '@/components/guide-navigation-animation';
import { MyResourcesNavigationAnimation } from '@/components/my-resources-navigation-animation';
import { RequestsNavigationAnimation } from '@/components/requests-navigation-animation';
import { AdminNavigationAnimation } from '@/components/admin-navigation-animation';
import { TeamNavigationAnimation } from '@/components/team-navigation-animation';
import { AboutNavigationAnimation } from '@/components/about-navigation-animation';
import { publicNavigationMotionStateEvent, usePublicContentMotion } from '@/components/public-content-motion';
import './public-content-motion.css';
import { SupportDesk } from '@/components/support-desk';
import { OrganizationMembershipDirectory, OrganizationVerificationReviewPanel, OrganizationWorkspacePanel } from '@/components/organization-workspace';
import './home-page-hero.css';
import './home-photo-effects.css';
import { getResourceCoverPhoto } from './resource-listing-photos';
import { HomeGreeting } from '@/components/home-greeting';
import AboutPage from '@/pages/about-page';
import electronicsCategoryImage from './electronics-category.webp';
import spacesCategoryImage from './spaces-category.webp';
import toolsEquipmentCategoryImage from './tools-equipment-category.webp';
import eventsCommunityCategoryImage from './events-community-category.webp';
import sportsRecreationCategoryImage from './sports-recreation-category.webp';
import learningMaterialsCategoryImage from './learning-materials-category.webp';
import kitchenCateringCategoryImage from './kitchen-catering-category.webp';
import mobilityTransportCategoryImage from './mobility-transport-category.webp';
import technicalServicesCategoryImage from './technical-services-category.webp';
import creativeMediaCategoryImage from './creative-media-category.webp';
import otherResourcesCategoryImage from './other-resources-category.webp';
import homeDailyLivingCategoryImage from './home-daily-living-category.webp';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const brandLogoPath = `${basePath}/resourcebridge-shared-resources-logo.png`;
const brandMarkPath = `${basePath}/resourcebridge-shared-resources-mark.png`;
const brandLogoUrl = `${window.location.origin}${brandLogoPath}`;
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
const resourceCategories = [
  { value: 'space', label: 'Spaces', description: 'Rooms, studios and shared venues', icon: GraduationCap },
  { value: 'electronics', label: 'Electronic gadgets', description: 'Laptops, cameras and devices', icon: Settings2 },
  { value: 'equipment', label: 'Tools & equipment', description: 'Tools and practical gear', icon: Hammer },
  { value: 'technical', label: 'Technical services', description: 'Specialist help and services', icon: FlaskConical },
  { value: 'learning', label: 'Learning materials', description: 'Books, kits and study aids', icon: GraduationCap },
  { value: 'sports', label: 'Sports & recreation', description: 'Sports and outdoor activities', icon: Activity },
  { value: 'events', label: 'Events & community', description: 'Supplies for shared events', icon: CalendarDays },
  { value: 'mobility', label: 'Mobility & transport', description: 'Ways to get around', icon: Compass },
  { value: 'household', label: 'Home & daily living', description: 'Everyday household resources', icon: Drill },
  { value: 'creative', label: 'Creative & media', description: 'Art, audio and media gear', icon: Sparkles },
  { value: 'kitchen', label: 'Kitchen & catering', description: 'Cooking and serving supplies', icon: Settings2 },
  { value: 'other', label: 'Other resources', description: 'Useful items beyond the list', icon: CircleHelp },
] as const;
type ResourceCategory = (typeof resourceCategories)[number]['value'];
const homeCategoryIcons = {
  space: Building2, electronics: Laptop, equipment: Hammer, technical: Wrench,
  learning: BookOpen, sports: Dumbbell, events: CalendarDays, mobility: Bike,
  household: House, creative: Palette, kitchen: CookingPot, other: Boxes,
};
const categoryImages: Partial<Record<ResourceCategory, string>> = {
  space: spacesCategoryImage,
  electronics: electronicsCategoryImage,
  equipment: toolsEquipmentCategoryImage,
  events: eventsCommunityCategoryImage,
  sports: sportsRecreationCategoryImage,
  learning: learningMaterialsCategoryImage,
  kitchen: kitchenCateringCategoryImage,
  mobility: mobilityTransportCategoryImage,
  technical: technicalServicesCategoryImage,
  creative: creativeMediaCategoryImage,
  other: otherResourcesCategoryImage,
  household: homeDailyLivingCategoryImage,
};
const homeResourcePhotos = resourceCategories.flatMap(({ value, label }) => {
  const src = categoryImages[value];
  return src ? [{ value, label, src }] : [];
});
function resourceCategoryLabel(category: string) {
  return resourceCategories.find(item => item.value === category)?.label ?? category;
}

const appearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: brandLogoUrl },
  variables: { colorPrimary: '#3368bf', colorForeground: '#202b40', colorMutedForeground: '#63758a', colorDanger: '#a34432', colorBackground: '#fbfcfe', colorInput: '#fbfcfe', colorInputForeground: '#263b55', colorNeutral: '#d7e0ea', fontFamily: 'DM Sans', borderRadius: '0.65rem' },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbfcfe] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#202b40] font-bold', headerSubtitle: 'text-[#63758a]', socialButtonsBlockButtonText: 'text-[#202b40] font-semibold',
    formFieldLabel: 'text-[#53677f] font-semibold', footerActionLink: 'text-[#3368bf] font-semibold', footerActionText: 'text-[#63758a]',
    dividerText: 'text-[#63758a]', identityPreviewEditButton: 'text-[#3368bf]', formFieldSuccessText: 'text-[#477650]', alertText: 'text-[#a34432]',
    logoBox: 'rounded-xl', logoImage: 'rounded-xl', socialButtonsBlockButton: 'border-[#d7e0ea] bg-[#fbfcfe]',
    formButtonPrimary: 'bg-[#3368bf] hover:bg-[#2c5db2] text-white', formFieldInput: 'border-[#d7e0ea] bg-[#fbfcfe] text-[#263b55]',
    footerAction: 'border-0', dividerLine: 'bg-[#d7e0ea]', alert: 'bg-[#f5e9e4]', otpCodeFieldInput: 'border-[#d7e0ea]',
    formFieldRow: 'gap-2', main: 'gap-4',
  },
};

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/explore', label: 'Explore resources', icon: Compass },
  { href: '/resources', label: 'My resources', icon: Drill },
  { href: '/requests', label: 'Requests', icon: ArrowRight },
  { href: '/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/organizations', label: 'Organizations', icon: UsersRound },
];
const accountNavItems = [
  { href: '/support', label: 'Customer care', icon: CircleHelp },
  { href: '/profile', label: 'Profile & verification', icon: ShieldCheck },
  { href: '/demo-guide', label: 'How it works', icon: CircleHelp },
  { href: '/admin', label: 'Organization admin', icon: Settings2 },
];
const navigationRevealEvent = 'resourcebridge:navigation-reveal';
const navigationRevealItems = [...navItems, ...accountNavItems, { href: '/about', label: 'About', icon: CircleHelp }, { href: '/team', label: 'Team', icon: UsersRound }];
const dimensionalRevealPaths = new Set(['/explore', '/dashboard', '/bookings', '/organizations', '/support', '/profile', '/demo-guide', '/resources', '/requests', '/admin', '/about', '/team']);
function requestNavigationReveal(href: string, label: string) {
  window.dispatchEvent(new CustomEvent(navigationRevealEvent, { detail: { href, label } }));
}
function NavigationRevealController() {
  const [path] = useLocation();
  const [section, setSection] = useState<{ href: string; label: string; sequence: number } | null>(null);
  const timer = useRef<number | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(publicNavigationMotionStateEvent, { detail: { active: section !== null } }));
  }, [section]);
  useEffect(() => {
    const handleReveal = (event: Event) => {
      const detail = (event as CustomEvent<{ href: string; label: string }>).detail;
      if (!detail || !navigationRevealItems.some(item => item.href === detail.href)) return;
      setSection({ href: detail.href, label: detail.label, sequence: ++sequence.current });
      if (timer.current !== null) window.clearTimeout(timer.current);
      const revealDuration = dimensionalRevealPaths.has(detail.href) || !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 4000 : 650;
      timer.current = window.setTimeout(() => {
        setSection(null);
        timer.current = null;
      }, revealDuration);
    };
    window.addEventListener(navigationRevealEvent, handleReveal);
    return () => {
      window.removeEventListener(navigationRevealEvent, handleReveal);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (path === '/explore') requestNavigationReveal('/explore', 'Explore resources');
    if (path === '/about') requestNavigationReveal('/about', 'About');
    if (path === '/team') requestNavigationReveal('/team', 'Team');
  }, [path]);
  if (!section) return null;
  const stopReveal = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setSection(null);
  };
  const currentItem = navigationRevealItems.find(item => item.href === section.href);
  const Icon = currentItem?.icon ?? Activity;
  const referenceMotion = dimensionalRevealPaths.has(section.href);
  return <div key={section.sequence} className="rb-nav-reveal" data-section={section.href === '/dashboard' ? 'overview' : section.href === '/about' ? 'about' : section.href === '/team' ? 'team' : undefined} data-motion-override={referenceMotion ? 'true' : undefined} data-testid="animation-navigation-reveal">
    <div className="rb-nav-reveal-content">
      {section.href === '/resources' ? <MyResourcesNavigationAnimation/> : section.href === '/requests' ? <RequestsNavigationAnimation/> : section.href === '/admin' ? <AdminNavigationAnimation/> : section.href === '/demo-guide' ? <GuideNavigationAnimation/> : section.href === '/profile' ? <ProfileNavigationAnimation/> : section.href === '/support' ? <SupportNavigationAnimation/> : section.href === '/explore' ? <ExploreNavigationAnimation/> : section.href === '/organizations' ? <OrganizationNavigationAnimation/> : section.href === '/bookings' ? <BookingNavigationAnimation/> : section.href === '/dashboard' ? <OverviewNavigationAnimation/> : section.href === '/about' ? <AboutNavigationAnimation/> : section.href === '/team' ? <TeamNavigationAnimation/> : <div aria-hidden="true" className="rb-nav-reveal-icon"><Icon size={38} strokeWidth={2.2}/></div>}
      <span className="rb-nav-reveal-label" aria-hidden="true">{section.label}</span>
      {referenceMotion && <button type="button" className="rb-nav-reveal-stop" onClick={stopReveal} data-testid={section.href === '/resources' ? 'button-stop-my-resources-reveal' : section.href === '/requests' ? 'button-stop-requests-reveal' : section.href === '/admin' ? 'button-stop-admin-reveal' : section.href === '/demo-guide' ? 'button-stop-guide-reveal' : section.href === '/profile' ? 'button-stop-profile-reveal' : section.href === '/support' ? 'button-stop-support-reveal' : section.href === '/explore' ? 'button-stop-explore-reveal' : section.href === '/bookings' ? 'button-stop-bookings-reveal' : section.href === '/organizations' ? 'button-stop-organizations-reveal' : section.href === '/about' ? 'button-stop-about-reveal' : section.href === '/team' ? 'button-stop-team-reveal' : 'button-stop-overview-reveal'}>Stop Animation</button>}
    </div>
  </div>;
}

function Brand() {
  return <Link href="/" className="rb-brand" data-testid="link-brand" aria-label="ResourceBridge — Connecting resources, empowering people">
    <img className="rb-brand-image" src={brandMarkPath} alt="" width="512" height="364"/>
    <span className="rb-brand-copy">
      <strong className="rb-brand-name">ResourceBridge</strong>
      <span className="rb-brand-tagline">Connecting resources.<br/>Empowering people.</span>
    </span>
  </Link>;
}
function Button({ children, onClick, href, variant = '', testId, type = 'button', disabled = false, style }: { children: ReactNode; onClick?: () => void; href?: string; variant?: string; testId: string; type?: 'button'|'submit'; disabled?: boolean; style?: React.CSSProperties }) {
  const cls = `rb-btn ${variant}`;
  return href ? <Link href={href} className={cls} data-testid={testId} style={style}>{children}</Link> : <button type={type} onClick={onClick} disabled={disabled} className={cls} data-testid={testId} style={style}>{children}</button>;
}
function Heading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="rb-heading"><div><div className="rb-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function StatusBadge({ value }: { value: string }) {
  const text = value.replaceAll('_', ' ');
  return <span className={`rb-badge ${value.includes('pending') ? 'pending' : value}`} data-testid={`status-${value}`}>{text}</span>;
}
function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="rb-empty" data-testid="status-empty"><div className="rb-empty-icon"><Compass size={21}/></div><h3>{title}</h3><p>{copy}</p>{action}</div>;
}
function LoadingState() { return <div className="rb-grid" data-testid="status-loading">{[1,2,3].map(x=><div className="rb-card rb-panel rb-skeleton" key={x}/>)}</div>; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="rb-empty rb-card" data-testid="status-error"><div className="rb-empty-icon"><CircleHelp size={21}/></div><h3>We couldn’t load this view</h3><p>Give it another try. Your workspace is unchanged.</p><Button onClick={retry} testId="button-retry">Try again</Button></div>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <div className="rb-toast" role="status" data-testid="status-toast">{message}<button onClick={onClose} aria-label="Dismiss notification" data-testid="button-dismiss-toast" style={{ marginLeft: 12, color: 'white', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={14}/></button></div>; }
function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return fallback;
}

function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [path] = useLocation();
  const isCommunityPulse = path === '/dashboard';
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const profileQuery = useGetResourceBridgeProfile({ query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: !!user } });
  const accountType = profileQuery.data?.profile?.accountType;
  const isCareAccount = accountType === 'customer_care';
  const organizationMemberships = useListMyResourceBridgeOrganizations({
    query: {
      queryKey: getListMyResourceBridgeOrganizationsQueryKey(),
      enabled: !!user && accountType !== undefined && accountType !== 'owner' && !isCareAccount,
    },
  });
  const hasOrganizationManagerAccess = (organizationMemberships.data ?? []).some(membership =>
    membership.status === 'active' && ['org_owner', 'org_admin', 'resource_manager'].includes(membership.role),
  );
  const displayName = profileQuery.data?.profile?.displayName || user?.fullName || 'Your account';
  const visibleNavItems = isCareAccount ? [] : accountType === 'owner'
    ? navItems
    : hasOrganizationManagerAccess
      ? navItems.filter(({ href }) => ['/dashboard', '/explore', '/resources', '/requests', '/bookings', '/organizations'].includes(href))
      : navItems.filter(({ href }) => ['/dashboard', '/explore', '/bookings', '/organizations'].includes(href));
  const initials = `${user?.firstName?.[0] ?? 'R'}${user?.lastName?.[0] ?? 'B'}`;
  return <div className={`rb-app ${isCommunityPulse ? 'rb-community-pulse' : ''}`}>
    {!isCareAccount && <RatingNotificationWatcher userId={user?.id||''} displayName={displayName} accountType={accountType==='owner'?'owner':'customer'}/>}
    {open && <button aria-label="Close navigation overlay" onClick={() => setOpen(false)} data-testid="button-close-navigation-overlay" style={{ position:'fixed',inset:0,zIndex:25,background:'#173b3277',border:0 }}/>}
    <aside className={`rb-sidebar ${open ? 'open' : ''}`} aria-label="Workspace navigation">
       {isCommunityPulse ? <div className="rb-dashboard-sidebar-label">Workspace</div> : <><Brand/><div className="rb-nav-label">{isCareAccount?'Customer care':'Shared workspace'}</div></>}
      <nav className="rb-nav">{visibleNavItems.map(({href,label,icon:Icon}) => { const active = path === href || (href === '/resources' && path.startsWith('/resources/')); return <Link key={href} href={href} onClick={() => { setOpen(false); requestNavigationReveal(href,label); }} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} data-testid={`link-nav-${href.slice(1)}`}><Icon size={17}/><span>{label}</span></Link>; })}</nav>
       {isCareAccount ? <nav className="rb-nav"><Link href="/support" onClick={()=>{setOpen(false);requestNavigationReveal('/support','Customer care')}} className={path==='/support'?'active':''} aria-current={path==='/support'?'page':undefined} data-testid="link-nav-support"><CircleHelp size={17}/><span>Customer care</span></Link></nav> : <><div className="rb-nav-label" style={{marginTop:25}}>Your account</div>
       <nav className="rb-nav">{accountNavItems.filter(({href})=>href!=='/admin'||accountType==='owner').map(({href,label,icon:Icon})=>{const active=path===href;const testId=href==='/profile'?'link-nav-profile':href==='/demo-guide'?'link-nav-guide':href==='/support'?'link-nav-support':'link-nav-admin';return <Link key={href} href={href} onClick={()=>{setOpen(false);requestNavigationReveal(href,label)}} className={active?'active':''} aria-current={active?'page':undefined} data-testid={testId}><Icon size={17}/><span>{label}</span></Link>})}</nav></>}
        <div className="rb-side-bottom"><div className="rb-status"><i/> {isCareAccount?'Customer care workspace':'Resource network connected'}</div>{isCareAccount?<div className="rb-user" data-testid="text-care-agent-identity"><span className="rb-avatar">{initials}</span><span style={{minWidth:0,flex:1}}><strong style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</strong><small style={{color:'#b2c5bc'}}>Care team</small></span></div>:<Link href="/profile" onClick={()=>{setOpen(false);requestNavigationReveal('/profile','Profile & verification')}} className="rb-user" data-testid="link-sidebar-profile"><span className="rb-avatar">{initials}</span><span style={{minWidth:0,flex:1}}><strong style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</strong><small style={{color:'#b2c5bc'}}>{user?.primaryEmailAddress?.emailAddress || 'Account profile'}</small></span><ChevronDown size={14}/></Link>}<button className="rb-nav" style={{width:'100%',border:0,background:'transparent',textAlign:'left'}} onClick={() => void signOut({redirectUrl: basePath || '/'})} data-testid="button-shell-signout"><span style={{padding:'9px 8px',color:'#b9cdc3',fontSize:12}}>Sign out</span></button></div>
    </aside>
    <main className="rb-main">
      <header className="rb-topbar">
        <div className="rb-top-right">
          <button className="rb-btn icon rb-mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} data-testid="button-open-navigation"><Menu size={17}/></button>
          <span className="rb-crumb">{isCommunityPulse ? <>Workspace <span style={{color:'#bdc7d4'}}> / </span> Overview</> : <>RESOURCEBRIDGE <span style={{color:'#b2bcb5'}}> / </span> {title.toUpperCase()}</>}</span>
        </div>
        <div className="rb-top-right">
          <span className="rb-live"><i/> SHARING NETWORK</span>
          {isCareAccount ? null : isCommunityPulse
            ? <Link className="rb-dashboard-profile" href="/profile" onClick={()=>requestNavigationReveal('/profile','Profile & verification')} aria-label={`Account profile for ${displayName}`} data-testid="link-account-profile"><span className="rb-avatar">{initials}</span></Link>
            : <Link className="rb-btn icon" href="/profile" onClick={()=>requestNavigationReveal('/profile','Profile & verification')} aria-label="Account profile" data-testid="link-account-profile"><ShieldCheck size={17}/></Link>}
        </div>
      </header>
      <div className="rb-content">{children}</div>
    </main>
  </div>;
}

function RatingNotificationWatcher({userId,displayName,accountType}:{userId:string;displayName:string;accountType:'owner'|'customer'}) {
  const ratings=useGetResourceBridgeMyRatings({query:{queryKey:getGetResourceBridgeMyRatingsQueryKey(),enabled:!!userId,refetchInterval:30000}});
  const [notice,setNotice]=useState('');
  const previousCount=useRef<number|null>(null);
  const previousUser=useRef(userId);
  useEffect(()=>{
    if(previousUser.current!==userId){previousUser.current=userId;previousCount.current=null;}
  },[userId]);
  useEffect(()=>{
    if(!userId||!ratings.data)return;
    const storageKey=`resourcebridge:rating-last-seen:${userId}`;
    let baseline=previousCount.current;
    if(baseline===null){
      const stored=window.localStorage.getItem(storageKey);
      baseline=stored===null?ratings.data.count:Number(stored);
    }
    if(ratings.data.count>baseline){
      const phrase=`Good job, ${displayName||'there'}! Your ${accountType} rating just received another review.`;
      setNotice(phrase);
      window.setTimeout(()=>setNotice(''),5000);
      window.dispatchEvent(new Event('resourcebridge:new-rating'));
      const voiceEnabled=window.localStorage.getItem(`resourcebridge:rating-voice:${userId}`)==='on';
      if(voiceEnabled&&document.visibilityState==='visible'&&'speechSynthesis' in window){
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase));
      }
    }
    previousCount.current=ratings.data.count;
    window.localStorage.setItem(storageKey,String(ratings.data.count));
  },[ratings.data?.count,userId,displayName,accountType]);
  return notice?<div className="rb-rating-notification" role="status" data-testid="status-new-rating"><Star size={18} fill="currentColor"/><span>{notice}</span></div>:null;
}
function Protected({ children, requiredRole, allowOrganizationManager = false }: { children: ReactNode; requiredRole?: 'owner'; allowOrganizationManager?: boolean }) {
  const [path] = useLocation();
  const { isLoaded, user } = useUser();
  const profileQuery = useGetResourceBridgeProfile({
    query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: isLoaded && !!user },
  });
  const organizationMemberships = useListMyResourceBridgeOrganizations({
    query: {
      queryKey: getListMyResourceBridgeOrganizationsQueryKey(),
      enabled: isLoaded && !!user && allowOrganizationManager && !!profileQuery.data?.profile?.accountType && profileQuery.data.profile.accountType !== 'customer_care',
    },
  });
  const hasOrganizationManagerAccess = (organizationMemberships.data ?? []).some(membership =>
    membership.status === 'active' && ['org_owner', 'org_admin', 'resource_manager'].includes(membership.role),
  );
  const loadingState = path === '/dashboard' ? <PageLoadingState/> : <LoadingState/>;
  if (!isLoaded) return loadingState;
  if (!user) return <Redirect to="/sign-in"/>;
  if (profileQuery.isLoading) return loadingState;
  if (profileQuery.isError) return <ErrorState retry={() => void profileQuery.refetch()}/>;
  if (!profileQuery.data?.profile) return <Redirect to="/account-type"/>;
  if (!profileQuery.data.profile.detailsCompletedAt) return <Redirect to="/profile-setup"/>;
  if (profileQuery.data.profile.accountType === 'customer_care' && path !== '/support') return <Redirect to="/support"/>;
  if (requiredRole && profileQuery.data.profile.accountType !== requiredRole) {
    if (!allowOrganizationManager) return <Redirect to="/dashboard"/>;
    if (organizationMemberships.isLoading) return <LoadingState/>;
    if (organizationMemberships.isError) return <ErrorState retry={() => void organizationMemberships.refetch()}/>;
    if (!hasOrganizationManagerAccess) return <Redirect to="/dashboard"/>;
  }
  return children;
}

type ResourceScrollMotion = 'from-left' | 'fade-up-right' | 'fade-down-left' | 'flip-down';
function ResourceCard({ resource, animateOnScroll = false, scrollMotion = 'from-left', motionOverride = false }: { resource: ResourceBridgeResource; animateOnScroll?: boolean; scrollMotion?: ResourceScrollMotion; motionOverride?: boolean }) {
  const Icon = resource.category === 'space' ? GraduationCap : resource.category === 'technical' ? FlaskConical : Hammer;
  const photo = getResourceCoverPhoto(resource);
  const card = <Link href={`/resources/${resource.id}`} className="rb-card rb-resource-card" data-testid={`card-resource-${resource.id}`}>
    <div className="rb-resource-art" style={{position:'relative',overflow:'hidden'}}>{photo?<img src={photo.url} alt={photo.altText} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>:<Icon size={27}/>}<span className="rb-art-label" style={{position:'relative'}}>{resourceCategoryLabel(resource.category)} · {resource.organizationType}</span></div>
    <div className="rb-resource-body"><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'start'}}><h3>{resource.name}</h3><StatusBadge value={resource.status}/></div><p>{resource.organizationName} · {resource.location}</p><div className="rb-resource-meta"><span><MapPin size={12} style={{verticalAlign:'-2px',marginRight:4}}/>{resource.capacity ? `${resource.capacity} capacity` : 'Flexible access'}</span><strong style={{color:'#8d6b3d'}}>{resource.priceLabel || 'Ask owner'}</strong></div></div>
  </Link>;
  return animateOnScroll
    ? <ScrollReveal motion={scrollMotion} motionOverride={motionOverride}>{card}</ScrollReveal>
    : card;
}

function ScrollReveal({ children, motion = 'from-left', className = '', motionOverride = false }: { children: ReactNode; motion?: ResourceScrollMotion; className?: string; motionOverride?: boolean }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!revealRef.current || !('IntersectionObserver' in window)) {
      setRevealed(true);
      return;
    }
    // Wait until a meaningful part of each row is on-screen, rather than
    // finishing lower-row animations while only their top edge is visible.
    const height = revealRef.current.getBoundingClientRect().height;
    const threshold = Math.min(0.55, Math.max(0.05, (window.innerHeight - 80) * 0.55 / Math.max(height, 1)));
    const observer = new IntersectionObserver(([entry]) => {
      setRevealed(entry.isIntersecting && entry.intersectionRatio >= threshold);
    }, { threshold, rootMargin: '0px 0px -64px 0px' });
    observer.observe(revealRef.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={revealRef} className={`rb-reveal-anchor ${className}`}><div data-motion-override={motionOverride ? 'true' : undefined} className={`rb-scroll-reveal ${motion} ${revealed ? 'is-visible' : ''}`}>{children}</div></div>;
}

function PublicNav() {
  const [path] = useLocation();
  const link = (href: string, label: string, testId: string, reveal = false) => <Link href={href} className={path === href ? 'is-current' : ''} aria-current={path === href ? 'page' : undefined} onClick={reveal ? () => requestNavigationReveal(href, label) : undefined} data-testid={testId}>{label === 'Explore resources' ? 'Explore' : label}</Link>;
  return <header className="rb-public-nav rb-home-nav">
    <Brand/>
    <nav className="rb-public-links" aria-label="Main navigation">
      {link('/', 'Home', 'link-public-home')}
      {link('/about', 'About', 'link-public-about', true)}
      {link('/team', 'Team', 'link-public-team', true)}
      <Link href="/sign-in" data-testid="link-public-signin">Sign in</Link>
    </nav>
    <Link href="/sign-up" className="rb-btn primary rb-home-nav-join" data-testid="link-public-signup">Join Us <ArrowUpRight size={13}/></Link>
  </header>;
}
function PublicFooter() {
  return <footer className="rb-public-footer"><Brand/><span>Shared capacity. Stronger communities.</span><nav style={{display:'flex',gap:16,flexWrap:'wrap'}} aria-label="Footer navigation"><Link href="/about" onClick={()=>requestNavigationReveal('/about','About')} data-testid="link-footer-about">About</Link><Link href="/team" onClick={()=>requestNavigationReveal('/team','Team')} data-testid="link-footer-team">Team</Link></nav></footer>;
}
function PublicProfilePage() {
  const [path] = useLocation();
  const motionRef = usePublicContentMotion(path);
  const page = path === '/about' ? 'about' : 'team';
  return <div className="rb-public" data-testid={`page-${page}`}>
    <PublicNav/>
    <main ref={motionRef} className={`rb-content rb-public-entry ${page === 'team' ? 'rb-profile-main' : ''}`} aria-label={page === 'about' ? 'About' : 'Team'}>
      {page === 'about' ? <AboutPage/> : <div className="rb-team-grid">
        <article className="rb-profile-card" data-public-reveal="profile">
          <img
            className="rb-profile-photo rb-profile-photo-from-left"
            src={`${import.meta.env.BASE_URL}vipul-jain-profile.jpeg`}
            alt="Vipul Jain"
            width="1254"
            height="1254"
            fetchPriority="high"
          />
          <div className="rb-profile-copy rb-profile-copy-from-left">
            <h1>Vipul Jain</h1>
            <p className="rb-profile-role">B. Tech CSBS Student | MITS Gwalior</p>
            <p className="rb-profile-bio">
              A technology enthusiast and aspiring entrepreneur passionate about innovation, artificial intelligence, and business-driven solutions. Interested in combining technical expertise with creative problem-solving to build meaningful, user-focused digital experiences. Committed to continuous learning, strategic thinking, and turning ideas into practical solutions.
            </p>
          </div>
        </article>
        <article className="rb-profile-card" data-public-reveal="profile">
          <img
            className="rb-profile-photo rb-profile-photo-from-right"
            src={`${import.meta.env.BASE_URL}gontu-sujith-reddy.jpg`}
            alt="Gontu Sujith Reddy"
            width="914"
            height="586"
          />
          <div className="rb-profile-copy rb-profile-copy-from-right">
            <h1>Gontu Sujith Reddy</h1>
            <p className="rb-profile-role">Undergraduate · Open-source and hackathon enthusiast</p>
            <p className="rb-profile-bio">
              I am a 17-year-old undergraduate interested in open source and hackathons. I was also a professional badminton player.
            </p>
            <p className="rb-profile-bio">
              I want to upskill my mindset, as I believe the mind is the root of the tree.
            </p>
            <p className="rb-profile-motto">Mind (God) → Ideas (Soul) → Code (Life) / Prototype (Body)</p>
            <section className="rb-profile-works" aria-label="Some works">
              <h2>Some works</h2>
              <div className="rb-profile-certificates">
                <img
                  src={`${import.meta.env.BASE_URL}gontu-sujith-certificate-1.png`}
                  alt="Certificate included in Sujith's profile"
                  width="205"
                  height="147"
                  loading="lazy"
                />
                <img
                  src={`${import.meta.env.BASE_URL}gontu-sujith-certificate-2.png`}
                  alt="Certificate of participation included in Sujith's profile"
                  width="200"
                  height="147"
                  loading="lazy"
                />
              </div>
            </section>
          </div>
        </article>
        <article className="rb-profile-card" data-public-reveal="profile">
          <img
            src={`${import.meta.env.BASE_URL}lael-vasanth-profile.webp`}
            alt="Lael Vasanth"
            className="rb-profile-photo rb-profile-photo-from-left"
            width="768"
            height="1024"
            loading="lazy"
          />
          <div className="rb-profile-copy rb-profile-copy-from-left">
            <h1>Lael Vasanth</h1>
            <p className="rb-profile-role">Engineering student · Competitive athlete · Hyderabad, Telangana</p>
            <p className="rb-profile-bio">
              I’m Lael Vasanth, an engineering student and competitive athlete based in Hyderabad, Telangana, India. I’m pursuing my first year in Computer Science and Engineering at Geethanjali College of Engineering and Technology (GCET).
            </p>
            <p className="rb-profile-bio">
              Alongside my studies, I’m active in the local technology community, participating in hackathons and developer challenges.
            </p>
          </div>
        </article>
      </div>}
    </main>
    <PublicFooter/>
  </div>;
}
function HomePage() {
  const [heroPhotoStep, setHeroPhotoStep] = useState(0);
  const [photosPaused, setPhotosPaused] = useState(false);
  const readyHeroPhotos = useRef(new Set<string>());
  const [photoLoadError, setPhotoLoadError] = useState('');
  useEffect(() => {
    if (photosPaused || homeResourcePhotos.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroPhotoStep(step => {
        const next = homeResourcePhotos[(step + 1) % homeResourcePhotos.length];
        return readyHeroPhotos.current.has(next.value) ? step + 1 : step;
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [photosPaused]);
  const heroPhotoIndex = heroPhotoStep % homeResourcePhotos.length;
  const activeHeroPhoto = homeResourcePhotos[heroPhotoIndex] ?? homeResourcePhotos[0];
  const ActiveHeroCategoryIcon = activeHeroPhoto
    ? homeCategoryIcons[activeHeroPhoto.value]
    : CircleHelp;
  const previousHeroPhoto = heroPhotoStep > 0
    ? homeResourcePhotos[(heroPhotoIndex + homeResourcePhotos.length - 1) % homeResourcePhotos.length]
    : undefined;
  return <div className="rb-public rb-home-public"><PublicNav/><section
    className="rb-hero rb-home-centered rb-home-photo-story"
  >
    <div className="rb-home-sticky-stage rb-home-effects-enabled" data-paused={photosPaused}>
      {activeHeroPhoto && <div
        className="rb-home-category-badge"
        data-testid="home-photo-category"
      >
        <span key={`icon-${activeHeroPhoto.value}`} className="rb-home-category-icon"><ActiveHeroCategoryIcon size={18} aria-hidden="true"/></span>
        <span key={`label-${activeHeroPhoto.value}`} className="rb-home-category-label">{activeHeroPhoto.label}</span>
      </div>}
      <div className="rb-home-heading">
        <HomeGreeting/>
        <h1 className="rb-home-title">ResourceBridge<span>.</span></h1>
      </div>
      <figure className="rb-home-photo-frame rb-home-photo-sequence rb-home-photo-effects" data-paused={photosPaused} aria-label={activeHeroPhoto?.label ?? 'Explore resource photos'}>
        {homeResourcePhotos.map(photo => {
          const isCurrent = photo.value === activeHeroPhoto?.value;
          const isPrevious = photo.value === previousHeroPhoto?.value;
          const reportFailure = () => {
            setPhotoLoadError(`Unable to load ${photo.label}. Slideshow paused.`);
            setPhotosPaused(true);
          };
          return <img
            key={photo.value}
            className={`rb-home-sequence-photo ${isCurrent ? (heroPhotoStep > 0 ? 'is-entering' : 'is-current') : isPrevious ? 'is-exiting' : 'is-inactive'}`}
            src={photo.src}
            alt={isCurrent ? `${photo.label} from Explore resources` : ''}
            aria-hidden={!isCurrent}
            loading="eager"
            fetchPriority={isCurrent ? 'high' : 'low'}
            onLoad={event => {
              const image = event.currentTarget;
              void image.decode().then(() => {
                readyHeroPhotos.current.add(photo.value);
              }).catch(reportFailure);
            }}
            onError={reportFailure}
          />;
        })}
        <span key={heroPhotoStep} className="rb-home-photo-progress" aria-hidden="true"><i/></span>
        {photoLoadError && <p className="rb-home-photo-load-error" role="status">{photoLoadError}</p>}
        <button
          type="button"
          className="rb-home-photo-pause"
          onClick={() => setPhotosPaused(paused => !paused)}
          aria-label={photosPaused ? 'Play resource slideshow' : 'Pause resource slideshow'}
          aria-pressed={photosPaused}
          data-testid="button-home-photo-pause"
        >{photosPaused ? 'Play' : 'Pause'}</button>
      </figure>
      <div className="rb-home-bottomline">
        <div className="rb-home-location" aria-label="ResourceBridge, Hyderabad, India">
          <span>17.3616° N, 78.4747° E</span>
          <strong>City of Pearls, India</strong>
        </div>
        <Link href="/sign-up" className="rb-btn primary rb-home-bottom-join" data-testid="link-hero-join"><ArrowUpRight size={13}/><span>Join Us</span></Link>
        <Link href="/" className="rb-home-signature" aria-label="ResourceBridge home" data-testid="link-home-signature">
          <img src={brandMarkPath} alt="" width="512" height="364"/>
          <span><strong>ResourceBridge</strong><small>Connecting resources. Empowering people.</small></span>
        </Link>
      </div>
    </div>
  </section>
  <PublicFooter/>
  </div>;
}
function HomeRedirect() {
  const { user, isLoaded } = useUser();
  const profileQuery = useGetResourceBridgeProfile({ query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: isLoaded && !!user } });
  if (!isLoaded) return <PageLoadingState label="Loading ResourceBridge…"/>;
  if (user && profileQuery.isLoading) return <PageLoadingState/>;
  if (isLoaded && user) return <Redirect to={profileQuery.data?.profile?.accountType === 'customer_care' ? '/support' : '/dashboard'}/>;
  return <HomePage/>;
}

function ExplorePage({ categorySlug, searchMode = false }: { categorySlug?: string; searchMode?: boolean }) {
  const query = useListResourceBridgeResources();
  const { user } = useUser();
  const profileQuery = useGetResourceBridgeProfile({ query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: !!user } });
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState(() => searchMode ? new URLSearchParams(window.location.search).get('q') ?? '' : '');
  const [organization, setOrganization] = useState('all');
  const [searchCategory, setSearchCategory] = useState(() => searchMode ? new URLSearchParams(window.location.search).get('category') ?? 'all' : 'all');
  const [isLeavingResults, setIsLeavingResults] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [motionReplay, setMotionReplay] = useState(0);
  const [motionOverride, setMotionOverride] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const selectedCategory = resourceCategories.find(item => item.value === categorySlug);
  const categoryFilter = selectedCategory?.value ?? (searchMode ? searchCategory : 'all');
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const backToCategories = () => setIsLeavingResults(true);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categorySlug]);
  const rows = useMemo(() => (query.data ?? []).filter(r => (categoryFilter === 'all' || r.category === categoryFilter) && (!selectedCategory || r.category === selectedCategory.value) && (!searchMode || search.trim().length > 0) && (organization === 'all' || r.organizationType === organization) && `${r.name} ${resourceCategoryLabel(r.category)} ${r.description} ${r.location} ${r.organizationName}`.toLowerCase().includes(search.toLowerCase())), [query.data, search, searchMode, selectedCategory, categoryFilter, organization]);
  const categoryCounts = useMemo(() => new Map(resourceCategories.map(item => [item.value, (query.data ?? []).filter(resource => resource.category === item.value).length])), [query.data]);
  const categoryPreviews = useMemo(() => new Map(resourceCategories.map(item => [
    item.value,
    (query.data ?? []).filter(resource => resource.category === item.value).flatMap(resource => resource.photos.slice(0, 1)).slice(0, 3),
  ])), [query.data]);
  const canShare = !user || profileQuery.data?.profile?.accountType === 'owner';
  const emptyResultCard = <div className="rb-card"><EmptyState title={searchMode && !search.trim() ? 'Search the resource directory' : selectedCategory ? 'No listings in this category yet' : 'No matching resources'} copy={searchMode && !search.trim() ? 'Enter a name, resource type, place, or organization above.' : search || organization !== 'all' || searchCategory !== 'all' ? 'Try a different search or clear your filters.' : 'Check back soon for new resources in this section.'} action={search || organization !== 'all' || searchCategory !== 'all' ? <Button onClick={() => { setSearch(''); setOrganization('all'); setSearchCategory('all'); if (searchMode) setLocation('/explore/search?q=&category=all', { replace: true }); }} testId="button-clear-filters">Clear filters</Button> : undefined}/></div>;
  if (selectedCategory || searchMode) {
    const CategoryIcon = selectedCategory?.icon ?? CircleHelp;
    const resultTitle = selectedCategory?.label ?? 'Search results';
    return <div
      className={`rb-explore-results rb-explore-transition ${isLeavingResults ? 'exit-to-right' : `enter-from-left ${hasEntered ? 'is-entered' : ''}`}`}
      aria-busy={isLeavingResults}
      onTransitionEnd={event => {
        if (isLeavingResults && event.target === event.currentTarget && event.propertyName === 'transform') setLocation('/explore');
      }}
    >
      <Heading
        eyebrow={selectedCategory ? `EXPLORE / ${selectedCategory.label.toUpperCase()}` : 'THE RESOURCE DIRECTORY'}
        title={resultTitle}
        description={selectedCategory?.description ?? (search ? `Showing matches for “${search}”.` : 'Search the whole resource directory.')}
        action={<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button onClick={() => { setMotionOverride(true); setMotionReplay(value => value + 1); }} testId="button-replay-resource-motion"><Sparkles size={14}/>{motionOverride ? 'Replay animation' : 'Play animation'}</Button>{motionOverride && reducedMotion && <Button onClick={() => { setMotionOverride(false); setMotionReplay(value => value + 1); }} testId="button-resource-device-motion">Stop Animation</Button>}<Button onClick={backToCategories} testId="button-back-to-categories"><ArrowLeft size={14}/> All categories</Button></div>}
      />
      {reducedMotion && !motionOverride && <p className="rb-info" role="status" style={{marginBottom:16}}>Your device has reduced motion on. Select Play animation to enable movement for this view.</p>}
      {selectedCategory && <div className="rb-category-results-heading"><span className="rb-category-panel-icon"><CategoryIcon size={19}/></span><div><strong>Available {selectedCategory.label.toLowerCase()}</strong><small>Browse listings in this category.</small></div></div>}
      <form className="rb-searchbar rb-category-results-toolbar" onSubmit={event => { event.preventDefault(); if (searchMode) setLocation(`/explore/search?q=${encodeURIComponent(search.trim())}&category=${encodeURIComponent(searchCategory)}`, { replace: true }); }}>
        <div className="rb-search"><Search size={16}/><input className="rb-input" value={search} onChange={event => setSearch(event.target.value)} placeholder={selectedCategory ? `Search ${selectedCategory.label.toLowerCase()}…` : 'Search resources, places, organizations…'} data-testid="input-resource-search"/></div>
        {searchMode && <select className="rb-select" style={{width:'auto',minWidth:150}} value={searchCategory} onChange={event => setSearchCategory(event.target.value)} aria-label="Filter by category" data-testid="select-resource-category"><option value="all">All categories</option>{resourceCategories.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select>}
        <select className="rb-select" style={{width:'auto',minWidth:158}} value={organization} onChange={event => setOrganization(event.target.value)} aria-label="Filter by organization" data-testid="select-organization-type"><option value="all">All organizations</option>{['college','laboratory','makerspace','community','business','independent'].map(value=><option value={value} key={value}>{value}</option>)}</select>
        {searchMode && <button className="rb-btn primary rb-search-submit" type="submit" data-testid="button-search-resources">Search</button>}
        <span className="rb-category-results-count"><SlidersHorizontal size={13}/>{rows.length} listings</span>
      </form>
      {query.isLoading ? <LoadingState/> : query.isError ? <ErrorState retry={() => void query.refetch()}/> : rows.length
        ? <div className="rb-resource-grid">{rows.map((resource, index) => <ResourceCard key={`${categorySlug ?? 'search'}-${resource.id}-${index}-${motionReplay}`} resource={resource} animateOnScroll motionOverride={motionOverride} scrollMotion={categorySlug === 'electronics' ? 'flip-down' : index % 2 === 0 ? 'fade-up-right' : 'fade-down-left'}/>)}</div>
        : categorySlug === 'electronics'
          ? <ScrollReveal key={`electronics-empty-${motionReplay}`} motion="flip-down" motionOverride={motionOverride}>{emptyResultCard}</ScrollReveal>
          : emptyResultCard}
    </div>;
  }

  return <div className={`rb-category-picker rb-explore-transition enter-from-right ${hasEntered ? 'is-entered' : ''}`}>
    <Heading eyebrow="THE RESOURCE DIRECTORY" title="Explore resources" description="Choose a category to see its available listings." action={canShare?<Button href="/sign-up" variant="primary" testId="button-share-resource">Share a resource <ArrowRight size={14}/></Button>:undefined}/>
    <form className="rb-searchbar rb-explore-searchbar" onSubmit={event => { event.preventDefault(); const term = search.trim(); if (term) setLocation(`/explore/search?q=${encodeURIComponent(term)}`); }}>
      <div className="rb-search"><Search size={16}/><input className="rb-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search resources, places, organizations…" aria-label="Search all resources" data-testid="input-resource-search"/></div>
      <button className="rb-btn primary rb-search-submit" type="submit" disabled={!search.trim()} data-testid="button-search-resources">Search</button>
    </form>
    <section className="rb-category-section" aria-labelledby="resource-category-title">
      <div className="rb-category-section-head">
        <div><span className="rb-eyebrow">BROWSE BY CATEGORY</span><h2 id="resource-category-title">Find the right kind of resource</h2></div>
        <small>{resourceCategories.length} categories</small>
      </div>
      <div className="rb-category-panel-grid rb-explore-category-grid" role="group" aria-label="Resource categories">
        {resourceCategories.map(item => {
          const Icon = item.icon;
          const count = categoryCounts.get(item.value) ?? 0;
          const previews = categoryPreviews.get(item.value) ?? [];
          const categoryImage = categoryImages[item.value];
          return <button type="button" key={item.value} className={`rb-category-panel ${categoryImage ? 'has-category-image' : ''}`} aria-label={`Browse ${item.label}: ${count} ${count === 1 ? 'listing' : 'listings'}`} onClick={() => setLocation(`/explore/${item.value}`)} data-testid={`category-panel-${item.value}`}>
            <span className="rb-category-panel-top"><span className="rb-category-panel-icon"><Icon size={19}/></span><span className="rb-category-panel-count">{count} {count === 1 ? 'listing' : 'listings'}</span></span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
            {categoryImage
              ? <span className="rb-category-panel-photos rb-category-panel-featured-image" aria-hidden="true"><img src={categoryImage} alt="" loading="lazy"/></span>
              : previews.length > 0 && <span className="rb-category-panel-photos" aria-hidden="true">
                  {previews.map((photo, index) => <img key={`${photo.url}-${index}`} src={photo.url} alt="" loading={index === 0 ? 'eager' : 'lazy'}/>)}
                </span>}
            <ArrowUpRight size={15} className="rb-category-panel-arrow"/>
          </button>;
        })}
      </div>
    </section>
  </div>;
}

function DashboardPage() {
  const q = useGetResourceBridgeDashboard();
  const { user } = useUser();
  const qc = useQueryClient();
  const profileQuery = useGetResourceBridgeProfile({ query: { queryKey: getGetResourceBridgeProfileQueryKey(), enabled: !!user } });
  const bookingsQuery = useListResourceBridgeBookings({ query: { queryKey: getListResourceBridgeBookingsQueryKey(), enabled: !!user } });
  const ratingsQuery = useGetResourceBridgeMyRatings({ query: { queryKey: getGetResourceBridgeMyRatingsQueryKey(), enabled: !!user, refetchInterval: 30000 } });
  const decide = useDecideResourceBridgeBooking();
  const [toast, setToast] = useState('');
  const dash = q.data;
  const profile = profileQuery.data?.profile;
  const isOwner = profile?.accountType === 'owner';
  const allBookings = bookingsQuery.data ?? [];
  const customerBookings = allBookings.filter((booking) => booking.borrowerId === user?.id);
  const bookedResourceCount = new Set(customerBookings.filter((booking) => ['approved','checked_in','return_submitted','completed'].includes(booking.status)).map((booking) => booking.resourceId)).size;
  const openCustomerRequests = customerBookings.filter((booking) => booking.status === 'pending_approval').length;
  const customerUpcoming = customerBookings.filter((booking) => ['approved','checked_in','return_submitted'].includes(booking.status) && new Date(booking.endAt) > new Date());
  const upcoming = isOwner ? dash?.upcomingBookings ?? [] : customerUpcoming;
  const pendingRequest = isOwner ? allBookings.find((booking) => booking.ownerId === user?.id && booking.status === 'pending_approval') : undefined;
  const retry = () => { void Promise.all([q.refetch(), bookingsQuery.refetch(), profileQuery.refetch(), ratingsQuery.refetch()]); };
  const decideRequest = (booking: ResourceBridgeBooking, decision: 'approved' | 'rejected') => {
    decide.mutate(
      {
        id: booking.id,
        data: {
          decision,
          reason: decision === 'approved' ? 'Access confirmed by host.' : 'Please contact the host for more information.',
        },
      },
      {
        onSuccess: () => {
          void Promise.all([
            qc.invalidateQueries({ queryKey: getListResourceBridgeBookingsQueryKey() }),
            qc.invalidateQueries({ queryKey: getGetResourceBridgeDashboardQueryKey() }),
          ]);
          setToast(`Request ${decision}.`);
        },
        onError: (error) => setToast(apiErrorMessage(error, 'Could not update this request.')),
      },
    );
  };

  return <>
    {q.isLoading || bookingsQuery.isLoading || profileQuery.isLoading
      ? <PageLoadingState/>
      : q.isError || bookingsQuery.isError || profileQuery.isError || !dash
        ? <div className="cp-page"><div className="cp-content"><ErrorState retry={retry}/></div></div>
        : <CommunityPulseDashboard
            accountType={isOwner ? 'owner' : 'customer'}
            displayName={profile?.displayName || user?.fullName || user?.firstName || ''}
            ratingBadge={<RatingBadge summary={ratingsQuery.data} accountType={isOwner ? 'owner' : 'customer'} displayName={profile?.displayName || user?.fullName || ''} userId={user?.id || ''}/>}
            ownedResources={dash.ownedResources}
            incomingRequests={dash.incomingRequests}
            bookedResourceCount={bookedResourceCount}
            openCustomerRequests={openCustomerRequests}
            upcomingBookings={upcoming}
            recentActivity={dash.recentActivity}
            pendingRequest={pendingRequest}
            decisionPending={decide.isPending}
            onDecideRequest={decideRequest}
          />}
    {toast && <Toast message={toast} onClose={() => setToast('')}/>}
  </>;
}

function RatingBadge({ summary, accountType, displayName, userId }: { summary?: { average: number | null; count: number }; accountType: 'owner' | 'customer'; displayName: string; userId: string }) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const key = `resourcebridge:rating-voice:${userId}`;
    setVoiceEnabled(window.localStorage.getItem(key) === 'on');
  }, [userId]);
  useEffect(() => {
    const onNewRating=()=>{
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 2600);
    };
    window.addEventListener('resourcebridge:new-rating',onNewRating);
    return ()=>window.removeEventListener('resourcebridge:new-rating',onNewRating);
  }, []);
  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    window.localStorage.setItem(`resourcebridge:rating-voice:${userId}`, next ? 'on' : 'off');
  };
  const score = summary?.average == null ? '—' : summary.average.toFixed(1);
  return <div className={`rb-rating-badge ${celebrate?'rb-rating-celebrate':''}`} data-testid="rating-overview-badge" aria-label={`${accountType === 'owner' ? 'Owner' : 'Customer'} rating ${score} from ${summary?.count ?? 0} reviews`}>
    <RatingStarAnimation/>
    <span className="rb-rating-copy"><strong>{score}</strong><small>{accountType==='owner'?'Owner':'Customer'} rating · {summary?.count ?? 0} reviews</small></span>
    <button type="button" className="rb-rating-voice" onClick={toggleVoice} aria-label={voiceEnabled?'Turn off spoken rating praise':'Turn on spoken rating praise'} title={voiceEnabled?'Voice praise on':'Voice praise off'} data-testid="button-rating-voice">{voiceEnabled?<Volume2 size={15}/>:<VolumeX size={15}/>}</button>
  </div>;
}
function BookingRow({ booking }: { booking: ResourceBridgeBooking }) {
  return <div className="rb-row" data-testid={`booking-row-${booking.id}`}><span className="rb-row-icon"><CalendarDays size={16}/></span><div className="rb-row-main"><strong>{booking.resourceName}</strong><small>{new Date(booking.startAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})} – {new Date(booking.endAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {booking.purpose}</small></div><StatusBadge value={booking.status}/></div>;
}

function ResourcesPage() {
  const q = useListMyResourceBridgeResources();
  return <><Heading eyebrow="HOST TOOLS" title="My resources" description="Manage the spaces and equipment your community can access." action={<Button href="/resources/new" variant="primary" testId="button-create-resource">Create listing <ArrowRight size={14}/></Button>}/>
    <div className="rb-info" style={{marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div><strong>Customer ratings</strong><p style={{margin:'5px 0 0'}}>After you confirm a return, rate your customer in Bookings. Customers can rate you too.</p></div>
      <Button href="/bookings" testId="button-resources-rate-customers"><Star size={15}/> Rate customers</Button>
    </div>
    {q.isLoading ? <LoadingState/> : q.isError ? <ErrorState retry={()=>void q.refetch()}/> : q.data?.length ? <div className="rb-resource-grid">{q.data.map((resource,index)=><ResourceCard key={`${resource.id}-${index}`} resource={resource} animateOnScroll scrollMotion={index%2===0?'fade-up-right':'fade-down-left'}/>)}</div> : <div className="rb-card"><EmptyState title="Give an idle resource a new purpose" copy="List a room, specialist tool or technical service. You decide who can see it and what access looks like." action={<Button href="/resources/new" variant="primary" testId="button-empty-create-resource">Create your first listing <ArrowRight size={14}/></Button>}/></div>}
  </>;
}

type ResourcePhotoDraft = {
  id: string;
  file: File;
  previewUrl: string;
  objectPath: string | null;
  uploading: boolean;
  error: string | null;
};

function EditResourcePage() {
  const [,params]=useRoute('/resources/:id/edit');
  const {user}=useUser();
  const id=Number(params?.id);
  const q=useGetResourceBridgeResource(id,{query:{queryKey:getGetResourceBridgeResourceQueryKey(id),enabled:Number.isInteger(id)&&id>0}});
  if(q.isLoading)return <LoadingState/>;
  if(q.isError||!q.data)return <ErrorState retry={()=>void q.refetch()}/>;
  if(q.data.ownerId!==user?.id)return <div className="rb-info">Only the owner can edit this listing.</div>;
  return <NewResourcePage key={id} resource={q.data}/>;
}

function NewResourcePage({resource}:{resource?:ResourceBridgeResource}) {
  const [toast,setToast] = useState('');
  const [,setLocation] = useLocation();
  const qc = useQueryClient();
  const create = useCreateResourceBridgeResource();
  const edit = useUpdateResourceBridgeResource();
  const saving = create.isPending || edit.isPending;
  const [retainedPhotoIndexes,setRetainedPhotoIndexes] = useState(()=>resource?.photos.map((_,index)=>index)??[]);
  const photoUpload = useRequestResourceBridgePhotoUploadUrl();
  const [photos,setPhotos] = useState<ResourcePhotoDraft[]>([]);
  const previewUrls = useRef(new Set<string>());
  useEffect(()=>()=>{previewUrls.current.forEach(url=>URL.revokeObjectURL(url));previewUrls.current.clear();},[]);
  const memberships = useListMyResourceBridgeOrganizations();
  const verifiedOrganizations = useListResourceBridgeOrganizations();
  const managedIds = new Set((memberships.data??[]).filter(m=>m.status==='active'&&['org_owner','org_admin','resource_manager'].includes(m.role)).map(m=>m.organizationId));
  const linkableOrganizations = (verifiedOrganizations.data??[]).filter(org=>managedIds.has(org.id));
  const [form,setForm] = useState({name:resource?.name??'',category:resource?.category??'',description:resource?.description??'',organizationName:resource?.organizationName??'',organizationType:resource?.organizationType??'college',organizationId:resource?.organizationId?.toString()??'',location:resource?.location??'',capacity:resource?.capacity?.toString()??'',visibility:resource?.visibility??'public',requiresTraining:resource?.requiresTraining??false,supervised:resource?.supervised??false,priceLabel:resource?.priceLabel??'',timezone:resource?.timezone??(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles')});
  const update = (key: string, value: string | boolean) => setForm(old=>({...old,[key]:value}));
  const addPhotos = async (fileList: FileList | null) => {
    if(!fileList)return;
    const slots=Math.max(0,5-photos.length-retainedPhotoIndexes.length);
    const files=Array.from(fileList);
    if(files.length>slots)setToast('You can add up to five photos per resource.');
    const accepted:File[]=[];
    for(const file of files.slice(0,slots)){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setToast('Use PNG, JPEG, or WebP photos.');continue;}
      if(file.size>8*1024*1024){setToast('Each photo must be smaller than 8 MB.');continue;}
      accepted.push(file);
    }
    const drafts=accepted.map(file=>{
      const previewUrl=URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return {id:crypto.randomUUID(),file,previewUrl,objectPath:null,uploading:true,error:null} satisfies ResourcePhotoDraft;
    });
    setPhotos(current=>[...current,...drafts]);
    for(const draft of drafts){
      try{
        const upload=await photoUpload.mutateAsync({data:{name:draft.file.name,size:draft.file.size,contentType:draft.file.type as 'image/jpeg'|'image/png'|'image/webp'}});
        const result=await fetch(upload.uploadURL,{method:'PUT',headers:{'Content-Type':draft.file.type},body:draft.file});
        if(!result.ok)throw new Error('upload failed');
        setPhotos(current=>current.map(photo=>photo.id===draft.id?{...photo,objectPath:upload.objectPath,uploading:false}:photo));
      }catch{
        setPhotos(current=>current.map(photo=>photo.id===draft.id?{...photo,uploading:false,error:'Upload failed. Remove this photo and try again.'}:photo));
      }
    }
  };
  const removePhoto = (photoId:string) => setPhotos(current=>{
    const photo=current.find(item=>item.id===photoId);
    if(photo){URL.revokeObjectURL(photo.previewUrl);previewUrls.current.delete(photo.previewUrl);}
    return current.filter(item=>item.id!==photoId);
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if(!form.category){setToast('Choose the category where customers will find this resource.');return;}
    if(photos.some(photo=>photo.uploading||photo.error||!photo.objectPath)){setToast('Wait for every photo to finish uploading before publishing.');return;}
    const data={...form,organizationId:form.organizationId?Number(form.organizationId):null,photoUploadPaths:photos.map(photo=>photo.objectPath!).filter(Boolean),category:form.category as ResourceCategory,organizationType:form.organizationType as 'college'|'laboratory'|'makerspace'|'community'|'business'|'independent',visibility:form.visibility as 'public'|'organization'|'partners',capacity:form.capacity ? Number(form.capacity) : null};
    const options={
      onSuccess:async(saved:ResourceBridgeResource)=>{
        qc.setQueryData(getGetResourceBridgeResourceQueryKey(saved.id),saved);
        await Promise.all([qc.invalidateQueries({queryKey:getListMyResourceBridgeResourcesQueryKey()}),qc.invalidateQueries({queryKey:getGetResourceBridgeDashboardQueryKey()}),qc.invalidateQueries({queryKey:getListResourceBridgeResourcesQueryKey()}),qc.invalidateQueries({queryKey:getGetResourceBridgeResourceQueryKey(saved.id)})]);
        setLocation(`/resources/${saved.id}`);
      },
      onError:(error:unknown)=>setToast(apiErrorMessage(error,'Could not save this listing. Please try again.')),
    };
    if(resource)edit.mutate({id:resource.id,data:{...data,retainedPhotoIndexes}},options);
    else create.mutate({data},options);
  };
  return <><Heading eyebrow="HOST A RESOURCE" title={resource?'Edit listing':'Create a listing'} description="Set clear expectations so people know how to make a good request."/><div className="rb-form-layout"><form className="rb-card rb-form-card" onSubmit={submit} data-testid={resource?'form-edit-resource':'form-create-resource'}><fieldset disabled={saving} style={{border:0,padding:0,margin:0,minWidth:0}}><div className="rb-form-grid">
    {!!resource&&<div className="rb-field full"><strong>Current photos</strong><small>Keep these photos or remove them and upload replacements below.</small><div className="rb-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(125px,1fr))'}}>{retainedPhotoIndexes.map(index=><figure key={index} style={{margin:0}}><img src={resource.photos[index].url} alt={resource.photos[index].altText||resource.name} style={{width:'100%',height:96,objectFit:'cover',borderRadius:8}}/><Button onClick={()=>setRetainedPhotoIndexes(current=>current.filter(i=>i!==index))} testId={`button-remove-existing-photo-${index}`}>Remove photo</Button></figure>)}</div></div>}
    <label className="rb-field full">Resource name<input className="rb-input" required minLength={2} maxLength={160} value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Community ceramics studio" data-testid="input-resource-name"/></label>
    <div className="rb-field full rb-owner-category-picker"><div><strong>Choose a resource section</strong><small>Select the category where customers will find this listing.</small></div><div className="rb-category-panel-grid rb-owner-category-grid" role="group" aria-label="Choose resource category">{resourceCategories.map(item=>{const Icon=item.icon;const selected=form.category===item.value;return <button type="button" key={item.value} className={`rb-category-panel ${selected?'active':''}`} aria-pressed={selected} onClick={()=>update('category',item.value)} data-testid={`owner-category-panel-${item.value}`}><span className="rb-category-panel-top"><span className="rb-category-panel-icon"><Icon size={18}/></span><span className="rb-category-panel-count">{selected?'Selected':'Choose'}</span></span><strong>{item.label}</strong><small>{item.description}</small><ArrowUpRight size={14} className="rb-category-panel-arrow"/></button>})}</div></div>
    <label className="rb-field full">Organization link<select className="rb-select" value={form.organizationId} onChange={e=>{const selected=linkableOrganizations.find(org=>org.id===Number(e.target.value));setForm(old=>({...old,organizationId:e.target.value,organizationName:selected?.name??'',organizationType:selected?.type??'college'}));}} data-testid="select-resource-organization"><option value="">Independent listing</option>{linkableOrganizations.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select><small>Only verified organizations you manage can be linked.</small></label>
    <label className="rb-field">Organization type<select className="rb-select" disabled={!!form.organizationId} value={form.organizationType} onChange={e=>update('organizationType',e.target.value)} data-testid="select-resource-org-type">{['college','laboratory','makerspace','community','business','independent'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
    <label className="rb-field">Organization name<input className="rb-input" required readOnly={!!form.organizationId} value={form.organizationName} onChange={e=>update('organizationName',e.target.value)} placeholder="Who hosts this resource?" data-testid="input-organization-name"/></label>
    <label className="rb-field">Location<input className="rb-input" required value={form.location} onChange={e=>update('location',e.target.value)} placeholder="Neighborhood, city or campus" data-testid="input-resource-location"/></label>
    <label className="rb-field full">About this resource<textarea className="rb-textarea" required minLength={5} maxLength={4000} value={form.description} onChange={e=>update('description',e.target.value)} placeholder="What can people do here? Include practical details, access notes and what to expect." data-testid="input-resource-description"/></label>
    <div className="rb-field full" data-testid="section-resource-photos"><strong>Photos</strong><small>Add up to five PNG, JPEG, or WebP images. Maximum 8 MB each.</small><input className="rb-input" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={photos.length>=5} onChange={event=>{void addPhotos(event.target.files);event.target.value='';}} aria-label="Add resource photos" data-testid="input-resource-photos"/>{photos.length>0&&<div className="rb-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(125px,1fr))',marginTop:10}}>{photos.map(photo=><figure key={photo.id} className="rb-card rb-panel" style={{margin:0,padding:8}}><img src={photo.previewUrl} alt={`Preview of ${photo.file.name}`} style={{width:'100%',height:96,objectFit:'cover',borderRadius:8}}/><figcaption style={{fontSize:11,marginTop:6,overflowWrap:'anywhere'}}>{photo.uploading?'Uploading…':photo.error||photo.file.name}</figcaption><button type="button" className="rb-btn" onClick={()=>removePhoto(photo.id)} disabled={photo.uploading} aria-label={`Remove ${photo.file.name}`}>Remove</button></figure>)}</div>}</div>
    <label className="rb-field">Capacity <input className="rb-input" type="number" min="1" value={form.capacity} onChange={e=>update('capacity',e.target.value)} placeholder="Optional" data-testid="input-resource-capacity"/></label>
    <label className="rb-field">Access cost <input className="rb-input" maxLength={80} value={form.priceLabel} onChange={e=>update('priceLabel',e.target.value)} placeholder="Free, $12 / hour, sliding scale" data-testid="input-resource-price"/></label>
    <label className="rb-field">Who can see this?<select className="rb-select" value={form.visibility} onChange={e=>update('visibility',e.target.value)} data-testid="select-resource-visibility"><option value="public">Public network</option><option value="organization" disabled>Organization-only · setup required</option><option value="partners" disabled>Partner organizations · setup required</option></select></label>
    <label className="rb-field">Time zone<input className="rb-input" required value={form.timezone} onChange={e=>update('timezone',e.target.value)} data-testid="input-resource-timezone"/></label>
    <label className="rb-check full"><input type="checkbox" checked={form.requiresTraining} onChange={e=>update('requiresTraining',e.target.checked)} data-testid="checkbox-training"/>Visitors need training before access. <span>(Requests wait until qualification review is available.)</span></label>
    <label className="rb-check full"><input type="checkbox" checked={form.supervised} onChange={e=>update('supervised',e.target.checked)} data-testid="checkbox-supervised"/>Access is supervised by a host. <span>(Requests wait until supervisor assignment is available.)</span></label>
  </div><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:22}}><Button href={resource?`/resources/${resource.id}`:'/resources'} testId="link-cancel-resource">Cancel</Button><Button type="submit" variant="primary" disabled={saving||photos.some(photo=>photo.uploading)} testId="button-submit-resource">{saving?'Saving…':resource?'Save changes':'Publish listing'} <ArrowRight size={14}/></Button></div></fieldset></form><aside className="rb-info"><h3>Clear listings build trust.</h3>Be specific about the intended use, access requirements and any costs. You can control visibility without assigning anyone an unverified role.<div style={{marginTop:15,paddingTop:13,borderTop:'1px solid #d3ddd1'}}><ShieldCheck size={16} style={{verticalAlign:'-4px',marginRight:6}}/>Your account is the owner of this listing.</div></aside></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function ResourceDetailPage() {
  const [,params]=useRoute('/resources/:id');
  const {user}=useUser();
  const id=Number(params?.id || 0);
  const q=useGetResourceBridgeResource(id,{query:{queryKey:getGetResourceBridgeResourceQueryKey(id),enabled:id>0}});
  const [showRequest,setShowRequest]=useState(false);
  const [toast,setToast]=useState('');
  const qc=useQueryClient();
  const booking=useCreateResourceBridgeBooking();
  const [request,setRequest]=useState({startAt:'',endAt:'',purpose:'',teamSize:'1',acknowledgedRules:false});
  if(q.isLoading) return <LoadingState/>;
  if(q.isError||!q.data) return <ErrorState retry={()=>void q.refetch()}/>;
   const r=q.data;
   const isOwner=user?.id===r.ownerId;
   const isSample=r.ownerId==='resourcebridge-demo:category-samples';
   const needsReview=r.requiresTraining||r.supervised;
   const send=(e:FormEvent)=>{e.preventDefault();booking.mutate({data:{resourceId:r.id,startAt:new Date(request.startAt).toISOString(),endAt:new Date(request.endAt).toISOString(),purpose:request.purpose,teamSize:Number(request.teamSize),acknowledgedRules:true}},{onSuccess:()=>{void Promise.all([qc.invalidateQueries({queryKey:getListResourceBridgeBookingsQueryKey()}),qc.invalidateQueries({queryKey:getGetResourceBridgeDashboardQueryKey()})]);setShowRequest(false);setToast('Your access request has been sent.');},onError:error=>setToast(apiErrorMessage(error,'Request could not be sent. Please review your dates and try again.'))});};
    const photo = r.photos[0];
    return <>
      <ScrollReveal key={`detail-heading-${r.id}`} motion="from-left" className="rb-detail-heading-reveal"><Heading eyebrow={`${r.organizationName} · ${r.organizationType}`} title={r.name} description={`${resourceCategoryLabel(r.category)} · ${r.location}`} action={<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{isOwner&&<Button href={`/resources/${r.id}/edit`} variant="primary" testId="button-edit-resource">Edit listing</Button>}<Button href="/explore" testId="button-back-explore">Back to explore</Button></div>}/></ScrollReveal>
      <div className="rb-detail-grid">
        <ScrollReveal key={`detail-content-${r.id}`} motion="fade-up-right" className="rb-detail-reveal"><section className="rb-card" style={{padding:18}}>
          <div className={`rb-detail-hero${photo ? ' has-photo' : ''}`} data-testid="resource-detail-hero">
            {photo ? <img className="rb-detail-photo" src={photo.url} alt={photo.altText || r.name} loading="eager"/> : <h2>{r.category === 'space' ? 'Room to make something happen.' : 'The right resource, within reach.'}</h2>}
          </div>
          <div style={{padding:'20px 8px'}}>
            <p style={{fontSize:14,lineHeight:1.8,color:'#64766b'}}>{r.description}</p>
            <div className="rb-grid" style={{gridTemplateColumns:'repeat(2,1fr)',marginTop:22}}>
              <div className="rb-info"><span className="rb-eyebrow">ACCESS</span><div style={{fontWeight:700,color:'#36584b',marginTop:6}}>{r.requiresTraining?'Training required':'No training noted'}{r.supervised?' · Host supervised':''}</div></div>
              <div className="rb-info"><span className="rb-eyebrow">CAPACITY</span><div style={{fontWeight:700,color:'#36584b',marginTop:6}}>{r.capacity ?? 'Flexible'}</div></div>
            </div>
          </div>
        </section></ScrollReveal>
        <ScrollReveal key={`detail-plan-${r.id}`} motion="fade-down-left" className="rb-detail-reveal"><aside className="rb-card rb-panel">
          <div className="rb-panel-head"><h2>Plan your visit</h2><StatusBadge value={r.status}/></div>
          <div className="rb-row"><span className="rb-row-icon"><MapPin size={16}/></span><div className="rb-row-main"><strong>Where</strong><small>{r.location}</small></div></div>
          <div className="rb-row"><span className="rb-row-icon"><UsersRound size={16}/></span><div className="rb-row-main"><strong>Hosted by</strong><small>{r.organizationName}</small></div></div>
          <div className="rb-row"><span className="rb-row-icon"><Clock3 size={16}/></span><div className="rb-row-main"><strong>Access cost</strong><small>{r.priceLabel || 'Contact host for details'}</small></div></div>
          {isSample ? <div className="rb-info" role="note">Sample listing for demonstration only. Not available to book.</div> : isOwner ? <div className="rb-info">You manage this resource. Borrowing from your own listing is not allowed.</div> : needsReview ? <div className="rb-info" role="note">This listing needs verified training{r.supervised?' and host supervision':''}. Requests remain unavailable until those review steps are configured.</div> : user ? <Button onClick={()=>setShowRequest(true)} variant="primary" testId="button-request-access">Request access <ArrowRight size={14}/></Button> : <Button href="/sign-in" variant="primary" testId="button-signin-to-request">Sign in to request access <ArrowRight size={14}/></Button>}
          <p style={{fontSize:10,color:'#819087',lineHeight:1.55}}>Your request goes to the host for review. No booking is confirmed until approved.</p>
        </aside></ScrollReveal>
      </div>
    {showRequest&&<div className="rb-toast" style={{left:0,top:0,right:0,bottom:0,borderRadius:0,background:'#1b332e99',display:'grid',placeItems:'center',padding:20}}><form onSubmit={send} className="rb-card rb-form-card" style={{width:'min(100%,500px)',color:'#38574a',boxShadow:'0 20px 60px #19372c30'}}><div className="rb-panel-head"><h2>Request access</h2><button type="button" onClick={()=>setShowRequest(false)} className="rb-btn icon" aria-label="Close request form" data-testid="button-close-request"><X size={16}/></button></div><div className="rb-form-grid"><label className="rb-field">From<input className="rb-input" type="datetime-local" required value={request.startAt} onChange={e=>setRequest({...request,startAt:e.target.value})} data-testid="input-booking-start"/></label><label className="rb-field">Until<input className="rb-input" type="datetime-local" required value={request.endAt} onChange={e=>setRequest({...request,endAt:e.target.value})} data-testid="input-booking-end"/></label><label className="rb-field">People<input className="rb-input" type="number" min="1" value={request.teamSize} onChange={e=>setRequest({...request,teamSize:e.target.value})} data-testid="input-booking-team-size"/></label><label className="rb-field full">What are you working on?<textarea className="rb-textarea" minLength={3} required value={request.purpose} onChange={e=>setRequest({...request,purpose:e.target.value})} placeholder="A few words for the host" data-testid="input-booking-purpose"/></label><label className="rb-check full"><input type="checkbox" required checked={request.acknowledgedRules} onChange={e=>setRequest({...request,acknowledgedRules:e.target.checked})} data-testid="checkbox-booking-rules"/>I’ll follow the host’s access guidance and leave the resource ready for the next person.</label></div><div style={{display:'flex',justifyContent:'end',gap:9,marginTop:18}}><Button onClick={()=>setShowRequest(false)} testId="button-cancel-request">Cancel</Button><Button type="submit" variant="primary" disabled={booking.isPending} testId="button-submit-booking">{booking.isPending?'Sending…':'Send request'}</Button></div></form></div>}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function PublicOrWorkspace({ title, children }: { title: string; children: ReactNode }) {
  const {user}=useUser();
  const profileQuery=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:!!user}});
  if(user&&profileQuery.isLoading)return <div className="rb-public"><LoadingState/></div>;
  if(user&&profileQuery.isError)return <div className="rb-public"><ErrorState retry={()=>void profileQuery.refetch()}/></div>;
  if(user&&!profileQuery.data?.profile)return <Redirect to="/account-type"/>;
  if(user&&profileQuery.data?.profile&&!profileQuery.data.profile.detailsCompletedAt)return <Redirect to="/profile-setup"/>;
  if(user&&profileQuery.data?.profile?.accountType==='customer_care')return <Redirect to="/support"/>;
  if(user&&profileQuery.data?.profile?.accountType==='customer_care')return <Redirect to="/support"/>;
  return user ? <AppShell title={title}>{children}</AppShell> : <div className="rb-public"><PublicNav/><main className="rb-content">{children}</main></div>;
}

function RequestsPage() {
  const q=useListResourceBridgeBookings();
  const qc=useQueryClient();
  const {user}=useUser();
  const decide=useDecideResourceBridgeBooking();
  const [reason,setReason]=useState<Record<number,string>>({});
  const [toast,setToast]=useState('');
  const pending=(q.data??[]).filter(b=>b.ownerId===user?.id&&b.status==='pending_approval');
  const action=(b:ResourceBridgeBooking,decision:'approved'|'rejected')=>decide.mutate({id:b.id,data:{decision,reason:reason[b.id]|| (decision==='approved'?'Access confirmed by host.':'Please contact the host for more information.')}},{onSuccess:()=>{void Promise.all([qc.invalidateQueries({queryKey:getListResourceBridgeBookingsQueryKey()}),qc.invalidateQueries({queryKey:getGetResourceBridgeDashboardQueryKey()})]);setToast(`Request ${decision}.`);},onError:error=>setToast(apiErrorMessage(error,'Could not update this request.'))});
  return <><Heading eyebrow="HOST INBOX" title="Requests" description="Review access requests for resources you host."/><div className="rb-card rb-panel"><div className="rb-panel-head"><h2>Waiting for a decision</h2><span className="rb-badge pending">{pending.length} to review</span></div>{q.isLoading?<LoadingState/>:q.isError?<ErrorState retry={()=>void q.refetch()}/>:pending.length?<div className="rb-list">{pending.map(b=><div className="rb-row" key={b.id} style={{alignItems:'flex-start'}} data-testid={`request-row-${b.id}`}><span className="rb-row-icon"><ArrowRight size={16}/></span><div className="rb-row-main"><strong>{b.resourceName}</strong><small>{new Date(b.startAt).toLocaleString()} – {new Date(b.endAt).toLocaleString()}</small><small style={{marginTop:7,color:'#596d61'}}>{b.purpose} · {b.teamSize} people</small><input className="rb-input" style={{marginTop:10,maxWidth:500}} placeholder="Optional note for the requester" value={reason[b.id]??''} onChange={e=>setReason({...reason,[b.id]:e.target.value})} data-testid={`input-request-reason-${b.id}`}/><div style={{display:'flex',gap:8,marginTop:10}}><Button onClick={()=>action(b,'approved')} variant="primary" testId={`button-approve-${b.id}`} disabled={decide.isPending}><Check size={14}/>Approve</Button><Button onClick={()=>action(b,'rejected')} testId={`button-reject-${b.id}`} disabled={decide.isPending}>Decline</Button></div></div><StatusBadge value={b.status}/></div>)}</div>:<EmptyState title="No decisions waiting" copy="New requests for resources you host will appear here." action={<Button href="/resources" testId="button-requests-resources">Review your listings</Button>}/>}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function BookingsPage() {
  const q=useListResourceBridgeBookings();
  const qc=useQueryClient();
  const {user}=useUser();
  const checkin=useCheckInResourceBridgeBooking();
  const submitReturn=useSubmitResourceBridgeReturn();
  const confirmReturn=useConfirmResourceBridgeReturn();
  const [notes,setNotes]=useState<Record<number,string>>({});
  const [condition,setCondition]=useState<Record<number,string>>({});
  const [toast,setToast]=useState('');
  const refresh=()=>void Promise.all([qc.invalidateQueries({queryKey:getListResourceBridgeBookingsQueryKey()}),qc.invalidateQueries({queryKey:getGetResourceBridgeDashboardQueryKey()})]);
  const items=q.data??[];
  const doCheckin=(b:ResourceBridgeBooking)=>checkin.mutate({id:b.id,data:{condition:(condition[b.id]||'good') as 'good'|'minor_damage'|'damaged'|'missing',notes:notes[b.id]||''}},{onSuccess:()=>{refresh();setToast('Check-in recorded.');},onError:error=>setToast(apiErrorMessage(error,'Could not record check-in.'))});
  const doReturn=(b:ResourceBridgeBooking)=>submitReturn.mutate({id:b.id,data:{condition:(condition[b.id]||'good') as 'good'|'minor_damage'|'damaged'|'missing',notes:notes[b.id]||''}},{onSuccess:()=>{refresh();setToast('Return submitted to the host.');},onError:error=>setToast(apiErrorMessage(error,'Could not submit the return.'))});
  const doConfirm=(b:ResourceBridgeBooking)=>confirmReturn.mutate({id:b.id},{onSuccess:()=>{refresh();setToast('Return confirmed. Booking complete.');},onError:error=>setToast(apiErrorMessage(error,'Could not confirm the return.'))});
  return <><Heading eyebrow="ACCESS SCHEDULE" title="Bookings" description="Follow each visit from approved request to completed return."/><div className="rb-card rb-panel">{q.isLoading?<LoadingState/>:q.isError?<ErrorState retry={()=>void q.refetch()}/>:items.length?<div className="rb-list">{items.map(b=>{const isBorrower=user?.id===b.borrowerId;const isOwner=user?.id===b.ownerId;return <Fragment key={b.id}><div className="rb-row" style={{alignItems:'flex-start'}} data-testid={`booking-detail-${b.id}`}><span className="rb-row-icon"><CalendarDays size={16}/></span><div className="rb-row-main"><strong>{b.resourceName}</strong><small>{new Date(b.startAt).toLocaleString()} – {new Date(b.endAt).toLocaleString()}</small><small>{b.purpose} · group of {b.teamSize}</small>{['approved','checked_in','return_submitted'].includes(b.status)&&<div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:10}}>{b.status==='approved'&&isBorrower&&<><select className="rb-select" style={{width:145}} value={condition[b.id]||'good'} onChange={e=>setCondition({...condition,[b.id]:e.target.value})} aria-label={`Check-in condition for ${b.resourceName}`} data-testid={`select-checkin-condition-${b.id}`}><option value="good">Good condition</option><option value="minor_damage">Minor damage</option><option value="damaged">Damaged</option><option value="missing">Missing</option></select><input className="rb-input" style={{width:170}} placeholder="Check-in note" value={notes[b.id]||''} onChange={e=>setNotes({...notes,[b.id]:e.target.value})} data-testid={`input-checkin-notes-${b.id}`}/><Button onClick={()=>doCheckin(b)} testId={`button-checkin-${b.id}`} disabled={checkin.isPending}>Check in</Button></>}{b.status==='checked_in'&&isBorrower&&<><select className="rb-select" style={{width:145}} value={condition[b.id]||'good'} onChange={e=>setCondition({...condition,[b.id]:e.target.value})} aria-label={`Return condition for ${b.resourceName}`} data-testid={`select-return-condition-${b.id}`}><option value="good">Good condition</option><option value="minor_damage">Minor damage</option><option value="damaged">Damaged</option><option value="missing">Missing</option></select><input className="rb-input" style={{width:170}} placeholder="Return note" value={notes[b.id]||''} onChange={e=>setNotes({...notes,[b.id]:e.target.value})} data-testid={`input-return-notes-${b.id}`}/><Button onClick={()=>doReturn(b)} variant="primary" testId={`button-submit-return-${b.id}`} disabled={submitReturn.isPending}>Submit return</Button></>}{b.status==='return_submitted'&&isOwner&&<Button onClick={()=>doConfirm(b)} variant="primary" testId={`button-confirm-return-${b.id}`} disabled={confirmReturn.isPending}>Confirm return</Button>}{b.status==='approved'&&isOwner&&<small>Waiting for borrower check-in.</small>}{b.status==='checked_in'&&isOwner&&<small>Borrower has checked in.</small>}{b.status==='return_submitted'&&isBorrower&&<small>Waiting for host to confirm return.</small>}</div>}</div><StatusBadge value={b.status}/></div>{b.status==='completed'&&(isBorrower||isOwner)&&<BookingRatingAction booking={b}/>}</Fragment>})}</div>:<EmptyState title="No bookings yet" copy="When an access request is approved, the agreed dates and visit workflow appear here." action={<Button href="/explore" testId="button-bookings-explore">Find a resource</Button>}/>}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function BookingRatingAction({booking}:{booking:ResourceBridgeBooking}) {
  const qc=useQueryClient();
  const {user}=useUser();
  const recipient=user?.id===booking.ownerId?'customer':'owner';
  const ratings=useGetResourceBridgeMyRatings({query:{queryKey:getGetResourceBridgeMyRatingsQueryKey()}});
  const rate=useRateResourceBridgeBooking();
  const [stars,setStars]=useState(0);
  const [comment,setComment]=useState('');
  const [message,setMessage]=useState('');
  const saved=ratings.data?.ratedBookingIds.includes(booking.id)??false;
  const submit=()=>rate.mutate({id:booking.id,data:{stars,comment:comment.trim()||null}},{onSuccess:()=>{void qc.invalidateQueries({queryKey:getGetResourceBridgeMyRatingsQueryKey()});setMessage('Thanks for sharing your rating.');},onError:error=>setMessage(apiErrorMessage(error,'Your rating could not be saved.'))});
  if(saved||message==='Thanks for sharing your rating.')return <div className="rb-rating-confirmation" data-testid={`status-rating-saved-${booking.id}`}><Star size={15} fill="currentColor"/> Your rating for this {recipient} is saved.</div>;
  if(ratings.isError)return <div className="rb-rating-form"><span role="alert">Could not load your saved ratings.</span><Button onClick={()=>void ratings.refetch()} testId={`button-retry-ratings-${booking.id}`}>Retry</Button></div>;
  return <div className="rb-rating-form" data-testid={`form-rating-${booking.id}`}><div><strong>Rate your {recipient}</strong><small>{booking.resourceName} · Choose 1–5 stars and an optional note. Each participant can rate once.</small></div><div className="rb-rating-inputs"><div className="rb-rating-choice" role="group" aria-label={`Choose a rating for your ${recipient}`}>{[1,2,3,4,5].map(value=><button key={value} type="button" className={value<=stars?'selected':''} disabled={rate.isPending} onClick={()=>setStars(value)} aria-label={`Rate ${value} out of 5 stars`} aria-pressed={stars===value} data-testid={`button-rating-${booking.id}-${value}`}><Star size={19} fill={value<=stars?'currentColor':'none'}/></button>)}</div><input className="rb-input" maxLength={500} value={comment} disabled={rate.isPending} onChange={event=>setComment(event.target.value)} placeholder="Optional note" aria-label="Optional rating note" data-testid={`input-rating-note-${booking.id}`}/><Button onClick={submit} variant="primary" disabled={stars===0||rate.isPending||ratings.isLoading} testId={`button-submit-rating-${booking.id}`}>{rate.isPending?'Saving…':`Rate ${recipient}`}</Button></div>{message&&<small className="rb-rating-error" role="alert">{message}</small>}</div>;
}

function OrganizationsPage() {
  const organizations=useListResourceBridgeOrganizations();
  const resources=useListResourceBridgeResources();
  const listingCounts=useMemo(()=>{
    const counts=new Map<number,number>();
    (resources.data??[]).forEach(resource=>{
      if(resource.organizationId!==null) counts.set(resource.organizationId,(counts.get(resource.organizationId)??0)+1);
    });
    return counts;
  },[resources.data]);
  return <><Heading eyebrow="THE PEOPLE BEHIND THE LISTINGS" title="Organizations" description="Meet verified groups making their spaces, equipment and expertise more accessible."/><OrganizationVerificationReviewPanel/><OrganizationMembershipDirectory/><div className="rb-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))'}}>{organizations.isLoading||resources.isLoading?<LoadingState/>:organizations.isError||resources.isError?<ErrorState retry={()=>{void organizations.refetch();void resources.refetch();}}/>:organizations.data?.length?organizations.data.map((organization,i)=>{
    const count=listingCounts.get(organization.id)??0;
    return <div className="rb-card rb-panel" key={organization.id} data-testid={`organization-card-${i}`}><span className="rb-row-icon"><UsersRound size={18}/></span><div style={{marginTop:17}} className="rb-eyebrow">{organization.type} · Verified</div><h2 style={{font:'700 19px Manrope,sans-serif',color:'#2d4b42',margin:'5px 0'}}>{organization.name}</h2><p style={{color:'#7b8980',fontSize:12}}><MapPin size={13} style={{verticalAlign:'-2px',marginRight:4}}/>{organization.location}</p><p style={{color:'#64766b',fontSize:13}}>{organization.description}</p><div className="rb-resource-meta"><span>{count} linked {count===1?'resource':'resources'}</span><Link href="/explore" className="rb-small-link" data-testid={`link-org-listings-${i}`}>View listings <ArrowRight size={12}/></Link></div></div>;
  }):<div className="rb-card" style={{gridColumn:'1/-1'}}><EmptyState title="No verified organizations yet" copy="Organization profiles appear here after a trusted reviewer verifies them." action={<Button href="/explore" testId="button-orgs-explore">Explore listings</Button>}/></div>}</div></>;
}

function AdminPage() {
  const q=useListMyResourceBridgeResources();
  const [toast,setToast]=useState('');
  return <><Heading eyebrow="SCOPED WORKSPACE TOOLS" title="Organization admin" description="Create organization profiles, review membership requests, and manage hosted resources."/><OrganizationWorkspacePanel/>
    <div className="rb-grid rb-panels"><section className="rb-card rb-panel"><div className="rb-panel-head"><h2>Your hosted resources</h2><Link href="/resources/new" className="rb-small-link" data-testid="link-admin-create">Add listing <ArrowRight size={12}/></Link></div>{q.isLoading?<LoadingState/>:q.isError?<ErrorState retry={()=>void q.refetch()}/>:q.data?.length?<div className="rb-table-wrap"><table className="rb-table"><thead><tr><th>Resource</th><th>Visibility</th><th>State</th><th>Access</th></tr></thead><tbody>{q.data.map(r=><tr key={r.id} data-testid={`admin-resource-${r.id}`}><td><Link href={`/resources/${r.id}`} style={{fontWeight:700}}>{r.name}</Link><small style={{display:'block',color:'#87938b',marginTop:3}}>{r.organizationName}</small></td><td>{r.visibility}</td><td><StatusBadge value={r.status}/></td><td>{r.priceLabel||'Contact host'}</td></tr>)}</tbody></table></div>:<EmptyState title="No workspace listings" copy="Create a listing to manage its visibility and access expectations here." action={<Button href="/resources/new" testId="button-admin-create">Create a resource</Button>}/>}</section>
    <aside className="rb-info"><h3><ShieldCheck size={16} style={{verticalAlign:'-3px',marginRight:5}}/>Scoped by your account</h3><p>Membership roles are scoped to organizations. New organization profiles remain private until they pass verification.</p><Button onClick={()=>setToast('Billing and organization-wide policies are not part of this phase.')} testId="button-admin-policy" style={{marginTop:12}}>Workspace policies</Button></aside></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function ProfilePage() {
  const {user,isLoaded}=useUser();
  const [toast,setToast]=useState('');
  const profileQuery=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:isLoaded&&!!user}});
  if(!isLoaded||profileQuery.isLoading)return <LoadingState/>;
  if(profileQuery.isError)return <ErrorState retry={()=>void profileQuery.refetch()}/>;
  const verified=user?.primaryEmailAddress?.verification?.status==='verified';
  const profile=profileQuery.data?.profile;
  const roleLabel=profile?.accountType==='owner'?'Owner':profile?.accountType==='customer_care'?'Customer care':'Customer';
  const genderLabel=profile?.gender?.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())||'Not provided';
  return <><Heading eyebrow="YOUR RESOURCEBRIDGE ACCOUNT" title="Profile & verification" description="Manage the details you chose to share with ResourceBridge." action={<Button href="/profile-setup" testId="button-edit-profile-details">Edit profile details</Button>}/><div className="rb-grid rb-panels"><section className="rb-card rb-panel"><div style={{display:'flex',gap:15,alignItems:'center',marginBottom:22}}><div className="rb-avatar" style={{width:54,height:54,fontSize:17}}>{(profile?.displayName||user?.fullName||'RB').split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()}</div><div><h2 style={{margin:'0 0 4px',font:'700 20px Manrope,sans-serif',color:'#294a40'}} data-testid="text-profile-display-name">{profile?.displayName||user?.fullName||'ResourceBridge member'}</h2><small style={{color:'#849188'}}>Member account</small></div></div><div className="rb-row"><span className="rb-row-icon"><ShieldCheck size={16}/></span><div className="rb-row-main"><strong>Email address</strong><small data-testid="text-profile-email">{user?.primaryEmailAddress?.emailAddress||'Not provided'}</small></div><StatusBadge value={verified?'active':'pending'}/></div><div className="rb-row"><span className="rb-row-icon"><Check size={16}/></span><div className="rb-row-main"><strong>Email verification</strong><small>{verified?'Your primary email is verified.':'Verify your email in account settings to build trust with hosts.'}</small></div></div>
    <div className="rb-row"><span className="rb-row-icon"><UsersRound size={16}/></span><div className="rb-row-main"><strong>Account type</strong><small data-testid="text-account-type">{roleLabel}{profile?.accountType==='customer_care'?` — ${profile.customerCareStatus==='approved'?'approved agent':profile.customerCareStatus==='rejected'?'access not approved':'access request pending'}`:''}</small></div>{profile?.accountType==='customer_care'&&<StatusBadge value={profile.customerCareStatus==='approved'?'active':profile.customerCareStatus==='rejected'?'rejected':'pending'}/>}</div>
    <div className="rb-row"><span className="rb-row-icon"><CalendarDays size={16}/></span><div className="rb-row-main"><strong>Date of birth</strong><small data-testid="text-profile-birth-date">{profile?.birthDate||'Not provided'}</small></div></div><div className="rb-row"><span className="rb-row-icon"><MapPin size={16}/></span><div className="rb-row-main"><strong>City or region</strong><small data-testid="text-profile-city">{profile?.cityRegion||'Not provided'}</small></div></div><div className="rb-row"><span className="rb-row-icon"><UsersRound size={16}/></span><div className="rb-row-main"><strong>Gender</strong><small data-testid="text-profile-gender">{genderLabel}</small></div></div><Button onClick={()=>{void user?.primaryEmailAddress?.prepareVerification({strategy:'email_code'}).then(()=>setToast('Verification code sent. Complete verification through your account email.')).catch(()=>setToast('Could not start email verification.'))}} testId="button-profile-verify" disabled={verified}>Verify primary email</Button></section><aside className="rb-info"><h3>Your account, your access.</h3><p>Your date of birth, city/region, and gender are private profile details. They are not shown on public listings.</p><p>{profile?.accountType==='owner'?'You can share resources and review incoming access requests.':'You can discover resources and manage your access requests.'} {profile?.accountType==='customer_care'?(profile.customerCareStatus==='approved'?'Your approved customer-care access lets you take support tickets.':'Customer-care access is not enabled until approved.'):''}</p><div style={{marginTop:17}}><Link href="/demo-guide" className="rb-small-link" data-testid="link-profile-workflow">Read the sharing guide <ArrowRight size={12}/></Link></div></aside></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>;
}

function ProfileSetupPage() {
  const {user,isLoaded}=useUser();
  const [,setLocation]=useLocation();
  const queryClient=useQueryClient();
  const profileQuery=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:isLoaded&&!!user}});
  const saveDetails=useSaveResourceBridgeProfileDetails();
  const [error,setError]=useState('');
  const [form,setForm]=useState<{displayName:string;birthDate:string;cityRegion:string;gender:''|'woman'|'man'|'non_binary'|'prefer_not_to_say'}>({displayName:'',birthDate:'',cityRegion:'',gender:''});
  const profile=profileQuery.data?.profile;
  useEffect(()=>{
    setForm({
      displayName:profile?.displayName||user?.fullName||'',
      birthDate:profile?.birthDate||'',
      cityRegion:profile?.cityRegion||'',
      gender:(profile?.gender||'') as typeof form.gender,
    });
  },[profile?.displayName,profile?.birthDate,profile?.cityRegion,profile?.gender,user?.fullName]);
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    setError('');
    saveDetails.mutate({data:{displayName:form.displayName.trim(),birthDate:form.birthDate||null,cityRegion:form.cityRegion.trim()||null,gender:form.gender||null}},{
      onSuccess:response=>{
        queryClient.setQueryData(getGetResourceBridgeProfileQueryKey(),response);
        const destination=response.profile?.accountType==='owner'?'/dashboard':response.profile?.accountType==='customer_care'?'/support':'/explore';
        setLocation(destination);
      },
      onError:reason=>setError(apiErrorMessage(reason,'Your profile details could not be saved. Please try again.')),
    });
  };
  if(!isLoaded)return <div className="rb-public"><LoadingState/></div>;
  if(!user)return <Redirect to="/sign-in"/>;
  if(profileQuery.isLoading)return <div className="rb-public"><LoadingState/></div>;
  if(profileQuery.isError)return <div className="rb-public"><ErrorState retry={()=>void profileQuery.refetch()}/></div>;
  if(!profile)return <Redirect to="/account-type"/>;
  if(profile.detailsCompletedAt&&profile.accountType==='customer_care')return <Redirect to="/support"/>;
  return <div className="rb-public"><PublicNav/><main className="rb-content rb-account-type-page"><Heading eyebrow={profile.detailsCompletedAt?'YOUR PROFILE':'PROFILE SETUP · STEP 2'} title="A few details about you" description="Set up your profile in a few short steps. You can leave the optional details blank."/><form className="rb-card rb-form-card rb-profile-setup" onSubmit={submit} data-testid="form-profile-setup">
    <section className="rb-profile-step"><div className="rb-step-count">01</div><div className="rb-profile-step-content"><h2>Personal details</h2><p>Choose the name people should see when coordinating with you.</p><label className="rb-field">Display name<input className="rb-input" required minLength={2} maxLength={100} autoComplete="name" value={form.displayName} onChange={event=>setForm({...form,displayName:event.target.value})} placeholder="Your name" data-testid="input-profile-name"/></label></div></section>
    <section className="rb-profile-step"><div className="rb-step-count">02</div><div className="rb-profile-step-content"><h2>Optional details</h2><p>Date of birth and gender are optional and stay private to your account.</p><div className="rb-form-grid"><label className="rb-field">Date of birth <span className="rb-optional">Optional</span><input className="rb-input" type="date" max={new Date().toISOString().slice(0,10)} value={form.birthDate} onChange={event=>setForm({...form,birthDate:event.target.value})} data-testid="input-profile-birth-date"/></label><label className="rb-field">Gender <span className="rb-optional">Optional</span><select className="rb-select" value={form.gender} onChange={event=>setForm({...form,gender:event.target.value as typeof form.gender})} data-testid="select-profile-gender"><option value="">Select an option</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label></div></div></section>
    <section className="rb-profile-step"><div className="rb-step-count">03</div><div className="rb-profile-step-content"><h2>Where you’re based</h2><p>A city or region helps people understand what is nearby. Never enter a street address here.</p><label className="rb-field">City or region <span className="rb-optional">Optional</span><input className="rb-input" maxLength={120} autoComplete="address-level2" value={form.cityRegion} onChange={event=>setForm({...form,cityRegion:event.target.value})} placeholder="City, state/province or region" data-testid="input-profile-city"/></label></div></section>
    <div className="rb-profile-privacy"><ShieldCheck size={16}/>These details are private to your account and are not displayed on public listings.</div>
    {error&&<p className="rb-role-error" role="alert" data-testid="status-profile-setup-error">{error}</p>}
    <div className="rb-profile-submit">{profile.detailsCompletedAt?<Button href={profile.accountType==='owner'?'/dashboard':profile.accountType==='customer_care'?'/support':'/explore'} testId="link-profile-details-cancel">Back to workspace</Button>:<span className="rb-profile-required-note">Display name is required. All other details are optional.</span>}<Button type="submit" variant="primary" disabled={saveDetails.isPending} testId="button-save-profile-details">{saveDetails.isPending?'Saving…':profile.detailsCompletedAt?'Save profile':'Continue'} <ArrowRight size={14}/></Button></div>
  </form></main></div>;
}

function GuidePage() {
  const {user}=useUser();
  const profileQuery=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:!!user}});
  const isCustomer=user&&profileQuery.data?.profile?.accountType!=='owner';
  return <><Heading eyebrow="THE RESOURCEBRIDGE FIELD GUIDE" title="Sharing, made straightforward." description="A practical workflow for borrowing and hosting community resources."/><div className="rb-card rb-panel"><div className="rb-steps"><div className="rb-step"><small>01 / FIND</small><h3>Browse what’s nearby</h3><p>Explore open listings for spaces, equipment and technical services. Review visibility, capacity, cost and training requirements before you request.</p><Link href="/explore" className="rb-small-link" data-testid="link-guide-explore">Explore listings <ArrowRight size={12}/></Link></div><div className="rb-step"><small>02 / ASK</small><h3>Give the host context</h3><p>Choose the dates, group size and purpose. Hosts approve or decline requests; a submitted request is not a confirmed booking.</p><Link href="/sign-up" className="rb-small-link" data-testid="link-guide-join">Create an account <ArrowRight size={12}/></Link></div><div className="rb-step"><small>03 / ARRIVE</small><h3>Check in together</h3><p>Follow the agreed access instructions and record the condition when you arrive. Hosts may require training or supervision.</p></div><div className="rb-step"><small>04 / RETURN</small><h3>Leave it ready</h3><p>Submit a return condition and notes. The host confirms the handoff to close the booking and keep the network accountable.</p></div></div></div><div className="rb-grid rb-panels" style={{marginTop:17}}>{!isCustomer&&<div className="rb-info"><h3>For hosts</h3>Share only the details people need. Set visibility, access costs, capacity and training expectations clearly. Review each request before confirming access.</div>}<div className="rb-info"><h3>For borrowers</h3>Make a specific request, honor the host’s conditions and communicate changes early. If something is damaged or missing, record it in the booking workflow.</div></div></>;
}

type ResourceBridgeAccountType = 'owner' | 'customer' | 'customer_care';
const accountTypeOptions: { accountType: ResourceBridgeAccountType; label: string; copy: string; icon: typeof Drill }[] = [
  { accountType: 'owner', label: 'Owner', copy: 'Share spaces, equipment, or expertise and manage access requests.', icon: Drill },
  { accountType: 'customer', label: 'Customer', copy: 'Explore local resources and request access when you need them.', icon: Compass },
  { accountType: 'customer_care', label: 'Customer care', copy: 'Request to join the care team. This selection does not grant staff access.', icon: UsersRound },
];

function AccountTypePage() {
  const {isLoaded,user}=useUser();
  const [,setLocation]=useLocation();
  const queryClient=useQueryClient();
  const profileQuery=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:isLoaded&&!!user}});
  const saveProfile=useSetResourceBridgeProfile();
  const [saveError,setSaveError]=useState('');
  const saveAccountType=(accountType:ResourceBridgeAccountType)=>saveProfile.mutate(
    {data:{accountType}},
    {
      onSuccess:profileResponse=>{
        queryClient.setQueryData(getGetResourceBridgeProfileQueryKey(),profileResponse);
        setLocation('/profile-setup');
      },
      onError:error=>setSaveError(apiErrorMessage(error,'Your account type could not be saved. Please try again.')),
    },
  );
  if(!isLoaded)return <div className="rb-public"><LoadingState/></div>;
  if(!user)return <Redirect to="/sign-in"/>;
  if(profileQuery.isLoading)return <div className="rb-public"><LoadingState/></div>;
  if(profileQuery.isError)return <div className="rb-public"><ErrorState retry={()=>void profileQuery.refetch()}/></div>;
  const profile=profileQuery.data?.profile;
  const destination=!profile?.detailsCompletedAt?'/profile-setup':profile?.accountType==='owner'?'/dashboard':profile?.accountType==='customer_care'?'/support':'/explore';
  const roleLabel=profile?.accountType==='owner'?'Owner':profile?.accountType==='customer_care'?'Customer care':'Customer';
  return <div className="rb-public"><PublicNav/><main className="rb-content rb-account-type-page">
    <Heading eyebrow={profile?'ACCOUNT SETUP COMPLETE':'ONE LAST STEP'} title={profile?'Your account is ready.':'How will you use ResourceBridge?'} description={profile?'Your selection is saved to your account.':'Choose the account type that best matches how you’ll take part in the network.'}/>
    {profile ? <section className="rb-card rb-panel rb-account-type-confirmation" data-testid="status-account-type-saved">
      <span className={`rb-badge ${profile.accountType==='customer_care'?'pending':'active'}`}>{roleLabel}</span>
      <h2>{profile.accountType==='customer_care'?'Customer care access requested':'Account type saved'}</h2>
       <p>{profile.accountType==='customer_care'?'Your selection is saved as a customer-care access request. Agent tools appear only after approval.':'You can continue to the ResourceBridge workspace using your selected account type.'}</p>
      <Button href={destination} variant="primary" testId="button-continue-account">{profile.detailsCompletedAt?'Continue':'Finish profile setup'} <ArrowRight size={14}/></Button>
    </section> : <>
      <div className="rb-role-grid">{accountTypeOptions.map(({accountType,label,copy,icon:Icon})=><button key={accountType} className="rb-card rb-role-card" type="button" onClick={()=>saveAccountType(accountType)} disabled={saveProfile.isPending} data-testid={`button-select-role-${accountType}`}><span className="rb-row-icon"><Icon size={19}/></span><span className="rb-role-copy"><strong>{label}</strong><small>{copy}</small></span><ArrowRight size={16}/></button>)}</div>
      {saveProfile.isPending&&<p className="rb-role-status" role="status" data-testid="status-saving-account-type">Saving your selection…</p>}
      {saveError&&<p className="rb-role-error" role="alert" data-testid="status-account-type-error">{saveError}</p>}
    </>}
  </main></div>;
}

const resourceBridgeDemoAccounts = [
  { role: 'Admin', email: 'gontusujith2009@gmail.com', password: 'sujithreddy1234$$' },
  { role: 'Owner', email: 'gontusujith2020@gmail.com', password: 'radhekrishna1234$$' },
  { role: 'Customer', email: 'jvipul261@gmail.com', password: 'RadheKrishna1234$$' },
  { role: 'Customer Service Agent', email: 'jainvipul7921@gmail.com', password: 'Jainvipul1234$$' },
] as const;

function SampleAccountsPanel() {
  return <section className="rb-auth-samples" aria-labelledby="rb-auth-samples-title" data-testid="panel-sample-accounts">
    <h2 id="rb-auth-samples-title">Sample accounts</h2>
    <ul className="rb-auth-sample-list">
      {resourceBridgeDemoAccounts.map(account => <li key={account.role} className="rb-auth-sample-account">
        <strong>{account.role}</strong>
        <span>{account.email}</span>
        <small className="rb-auth-sample-password">Password: <code>{account.password}</code></small>
      </li>)}
    </ul>
    <p>Hackathon demo logins. Customer-care access still requires approval.</p>
  </section>;
}

function SignInPage() {
  return <div className="rb-auth">
    <SampleAccountsPanel/>
    <div className="rb-auth-copy"><Brand/><div className="rb-eyebrow">A MORE OPEN KIND OF ACCESS</div><h1>Good things are better when shared.</h1><p>Sign in to manage your listings, request a visit, or keep a community resource moving.</p></div>
    <div className="rb-auth-form"><Link href="/" className="rb-auth-back" data-testid="link-signin-back-home"><ArrowLeft size={14}/>Back to home</Link><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}/></div>
  </div>;
}
function SignUpPage() { return <div className="rb-auth"><SampleAccountsPanel/><div className="rb-auth-copy"><Brand/><div className="rb-eyebrow">JOIN THE RESOURCE NETWORK</div><h1>Make access more local.</h1><p>Create an account to connect with the people and places making underused resources available.</p></div><div className="rb-auth-form"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/account-type`}/></div></div>; }
function ClerkCacheInvalidator() {
  const {addListener}=useClerk(); const qc=useQueryClient(); const prev=useRef<string|null|undefined>(undefined);
  useEffect(()=>{const unsubscribe=addListener(({user})=>{const id=user?.id??null;if(prev.current!==undefined&&prev.current!==id)qc.clear();prev.current=id});return unsubscribe},[addListener,qc]);
  return null;
}
function RoleScopedAssistant() {
  const {user}=useUser();
  const profile=useGetResourceBridgeProfile({query:{queryKey:getGetResourceBridgeProfileQueryKey(),enabled:!!user}});
  if(user&&(profile.isLoading||profile.isError))return null;
  const accountType=profile.data?.profile?.accountType;
  return <AIAssistant careMode={!!user&&accountType==='customer_care'} accountType={user&&(accountType==='owner'||accountType==='customer')?accountType:undefined}/>;
}
function ClerkRoutes() {
  const [,setLocation]=useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{signIn:{start:{title:'Welcome back',subtitle:'Sign in to your ResourceBridge workspace'}},signUp:{start:{title:'Join ResourceBridge',subtitle:'Create an account to share what’s nearby'}}}}
    routerPush={to=>setLocation(stripBase(to))} routerReplace={to=>setLocation(stripBase(to),{replace:true})}>
    <QueryClientProvider client={queryClient}><ClerkCacheInvalidator/><NavigationRevealController/><Switch>
      <Route path="/" component={HomeRedirect}/>
      <Route path="/sign-in/*?" component={SignInPage}/><Route path="/sign-up/*?" component={SignUpPage}/>
      <Route path="/account-type" component={AccountTypePage}/>
      <Route path="/profile-setup" component={ProfileSetupPage}/>
      <Route path="/explore">{()=><PublicOrWorkspace title="Explore resources"><ExplorePage/></PublicOrWorkspace>}</Route>
      <Route path="/explore/search">{()=><PublicOrWorkspace title="Search resources"><ExplorePage searchMode/></PublicOrWorkspace>}</Route>
      <Route path="/explore/:category">{params=>{
        const category = resourceCategories.find(item => item.value === params.category);
        return category
          ? <PublicOrWorkspace title={`Explore ${category.label}`}><ExplorePage key={category.value} categorySlug={category.value}/></PublicOrWorkspace>
          : <NotFound/>;
      }}</Route>
      <Route path="/dashboard">{()=> <Protected><AppShell title="Overview"><DashboardPage/></AppShell></Protected>}</Route>
      <Route path="/resources">{()=> <Protected requiredRole="owner" allowOrganizationManager><AppShell title="My resources"><ResourcesPage/></AppShell></Protected>}</Route>
      <Route path="/resources/new">{()=> <Protected requiredRole="owner" allowOrganizationManager><AppShell title="Create a listing"><NewResourcePage/></AppShell></Protected>}</Route>
      <Route path="/about" component={PublicProfilePage}/>
      <Route path="/team" component={PublicProfilePage}/>
      <Route path="/support">{()=> <Protected><AppShell title="Customer care"><SupportDesk/></AppShell></Protected>}</Route>
      <Route path="/resources/:id/edit">{()=> <Protected><AppShell title="Edit listing"><EditResourcePage/></AppShell></Protected>}</Route>
      <Route path="/resources/:id">{()=> <PublicOrWorkspace title="Resource detail"><ResourceDetailPage/></PublicOrWorkspace>}</Route>
      <Route path="/requests">{()=> <Protected requiredRole="owner" allowOrganizationManager><AppShell title="Requests"><RequestsPage/></AppShell></Protected>}</Route>
      <Route path="/bookings">{()=> <Protected><AppShell title="Bookings"><BookingsPage/></AppShell></Protected>}</Route>
      <Route path="/organizations">{()=> <PublicOrWorkspace title="Organizations"><OrganizationsPage/></PublicOrWorkspace>}</Route>
      <Route path="/admin">{()=> <Protected requiredRole="owner"><AppShell title="Organization admin"><AdminPage/></AppShell></Protected>}</Route>
      <Route path="/profile">{()=> <Protected><AppShell title="Profile"><ProfilePage/></AppShell></Protected>}</Route>
      <Route path="/demo-guide">{()=> <PublicOrWorkspace title="How it works"><GuidePage/></PublicOrWorkspace>}</Route>
      <Route component={NotFound}/>
    </Switch><RoleScopedAssistant/></QueryClientProvider>
  </ClerkProvider>;
}
function Router() { return <ErrorBoundary><ClerkRoutes/></ErrorBoundary>; }
function App() { return <TooltipProvider><WouterRouter base={basePath}><Router/></WouterRouter><Toaster/></TooltipProvider>; }
export default App;
