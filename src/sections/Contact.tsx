import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { siteConfig } from "@/lib/constants";

const { social } = siteConfig;

const contacts = [
  { label: "Email", href: `mailto:${social.email}`, display: social.email, external: false },
  { label: "LinkedIn", href: social.linkedin ?? "#", display: "linkedin.com/in/abdelrhman-ahmed", external: true },
  { label: "GitHub", href: social.github ?? "#", display: "github.com/AbdoAhmed666", external: true },
];

export default function Contact() {
  return (
    <SectionContainer id="contact">
      <SectionHeading
        section="contact"
        title="Let’s Work Together"
        intro="Open to AI engineering roles, freelance projects, and collaborations. If you’re building something with LLMs, RAG, or ML — I’d like to hear about it."
      />

      <Reveal>
        <ul className="grid border-t border-line md:grid-cols-3">
          {contacts.map((contact) => (
            <li
              key={contact.label}
              className="border-b border-line md:border-l md:px-6 md:first:border-l-0 md:first:pl-0"
            >
              <a
                href={contact.href}
                {...(contact.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex flex-col gap-1 py-5"
              >
                <span className="text-body text-foreground transition-colors group-hover:text-accent">
                  {contact.label}
                  {contact.external && <span aria-hidden="true"> ↗</span>}
                </span>
                <span className="font-mono text-small break-all text-muted-foreground">
                  {contact.display}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </SectionContainer>
  );
}
