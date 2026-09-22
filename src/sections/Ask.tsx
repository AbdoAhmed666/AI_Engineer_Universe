/**
 * The ask section.
 *
 * Sits directly under the hero, because it is the one thing on this page a
 * visitor can operate rather than scroll past, and burying it under four
 * sections of prose would waste it.
 *
 * The section shell renders on the server; only the box itself is a client
 * component, so the heading and the explanation are in the prerendered
 * HTML whether or not the endpoint is reachable.
 */

import { SectionContainer, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { AskBox } from "@/components/system";

export default function Ask() {
  return (
    <SectionContainer id="ask">
      <SectionHeading
        section="ask"
        title="Ask this site a question."
        intro="A retrieval system over this portfolio's own data — the same three project definitions the diagram and the city are drawn from. It returns the claims themselves, so it has no way to invent one, and when it finds nothing it says so. Scored against real questions, in English and Arabic, and it runs in your browser."
      />

      <Reveal>
        <AskBox />
      </Reveal>
    </SectionContainer>
  );
}
