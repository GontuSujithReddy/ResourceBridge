import { ArrowRight, Check, Compass, HandHeart, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import "./about-page.css";

const commitments = [
  { icon: Compass, title: "Find the right fit", copy: "Explore community spaces, equipment, learning materials, and services near you." },
  { icon: ShieldCheck, title: "Know what to expect", copy: "Hosts set availability, access conditions, costs, and any supervision requirements." },
  { icon: HandHeart, title: "Share with care", copy: "Follow the agreed instructions and leave shared resources ready for the next person." },
];

export default function AboutPage() {
  return (
    <div className="rb-about-page" data-testid="about-resourcebridge">
      <header className="rb-about-hero" data-public-reveal="panel">
        <div className="rb-about-eyebrow">ABOUT RESOURCEBRIDGE</div>
        <h1>Making community resources easier to find and share.</h1>
        <p>We connect the people who have useful resources with the people and organizations who can put them to good use.</p>
      </header>

      <div className="rb-about-layout">
        <article className="rb-about-letter" data-public-reveal="panel">
          <div className="rb-about-letter-top"><span>A NOTE TO OUR COMMUNITY</span><span className="rb-about-letter-rule"/></div>
          <p className="rb-about-salutation">Dear community member,</p>
          <p>
            ResourceBridge began with a simple observation: many useful spaces, tools, materials, and skills are already close to home, yet the people who could benefit from them do not always know where to look or how to ask.
          </p>
          <p>
            Our purpose is to make those connections clearer. ResourceBridge gives individuals and organizations a place to share what is available, explain how access works, and help community members discover resources that fit their needs.
          </p>
          <p>
            Every host sets the terms for their own resource, including availability, access conditions, costs, and any required training or supervision. When you submit a request, the host reviews it; a request is not a confirmed booking until it has been accepted.
          </p>
          <p>
            We believe community sharing works best when people communicate thoughtfully, respect the host’s instructions, and take care of what has been shared. These small acts of trust help keep resources useful and make future connections possible.
          </p>
          <p>
            Thank you for being part of a community that makes more of what it already has.
          </p>
          <footer className="rb-about-signoff">
            <span>With appreciation,</span>
            <strong>The ResourceBridge Team</strong>
            <span>Connecting resources. Empowering people.</span>
          </footer>
          <Link href="/explore" className="rb-about-explore" data-testid="link-about-explore">
            Explore community resources <ArrowRight size={16}/>
          </Link>
        </article>

        <aside className="rb-about-commitments" aria-label="Our commitments" data-public-reveal="panel">
          <div className="rb-about-commitments-heading">
            <span><Check size={16}/></span>
            <div><div className="rb-about-eyebrow">OUR COMMITMENT</div><h2>Useful connections, built on clear expectations.</h2></div>
          </div>
          {commitments.map(({ icon: Icon, title, copy }, index) => (
            <section className="rb-about-commitment" key={title}>
              <span className="rb-about-commitment-icon"><Icon size={17}/></span>
              <div><div className="rb-about-commitment-index">0{index + 1}</div><h3>{title}</h3><p>{copy}</p></div>
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}
