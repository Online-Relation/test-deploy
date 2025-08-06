'use client';

import { Card } from "@/components/ui/card";

export default function CoupleProfileSection() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="p-6 prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
        <h3 className="mt-10">👩‍🎨 Stine</h3>
        <p><strong>Stine</strong> er et menneske med stor energi, kreativitet og varme, som trives bedst, når livet føles levende og stimulerende. Hun er impulsiv og følger ofte sine impulser før hun når at tænke det hele igennem, hvilket både giver hende charme og skaber udfordringer. Hun har svært ved struktur og praktiske rutiner, men har et stort følelsesliv og en evne til at mærke stemninger dybt – også selvom hun ikke altid sætter ord på dem. Hun længes efter frihed, intensitet og følelsen af at blive set og ønsket – samtidig med, at hun gerne vil være en nærværende mor og kæreste.</p>

        <h3 className="mt-10">🧠 Mads</h3>
        <p><strong>Mads</strong> er et reflekteret og ansvarsfuldt menneske med stor følelsesmæssig dybde og en stærk vilje til at forstå sig selv og dem, han elsker. Han har arbejdet målrettet med sin personlige udvikling og har bevæget sig fra at være selvudslettende til at stå mere ved sig selv og sine grænser. Han har et roligt og stabilt væsen, som søger tryghed, ærlighed og følelsesmæssig nærhed, men rummer også en legende side, der blomstrer, når han føler sig værdsat og tryg. Han elsker dybt og helhjertet – og selv når han er såret, rækker han ud i håb om, at kærligheden kan vokse videre.</p>

        <h3 className="mt-10">🔄 Jeres dynamik i korte træk</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Stine bringer liv, spontanitet, intensitet og følelsesmæssig kraft.</li>
          <li>Mads bringer stabilitet, refleksion, struktur og følelsesmæssig dybde.</li>
          <li>Klassisk ild & jord-dynamik: Stine tænder gnisten, Mads holder ilden ved lige.</li>
          <li>Mads skaber ro, Stine skaber bevægelse.</li>
          <li>Stine har brug for at føle sig fri for at kunne forpligte sig.</li>
          <li>Mads har brug for tryghed for at kunne åbne sig.</li>
        </ul>

        <h3 className="mt-10">🧩 Hvordan skaber I en stærk dynamik sammen?</h3>
        <ol className="list-decimal pl-6 space-y-6">
          <li>
            <strong>I skal ikke ligne hinanden – men lære at læne jer ind i forskellen:</strong>
            <ul className="list-disc pl-6 mt-2">
              <li>Mads kan blive mere levende og legende af Stines energi.</li>
              <li>Stine kan finde ro og retning i Mads' nærvær.</li>
              <li>Accepter forskelligheden – den skaber dynamikken I længes efter.</li>
            </ul>
          </li>
          <li>
            <strong>Indgå konkrete aftaler om struktur vs. frihed:</strong>
            <ul className="list-disc pl-6 mt-2">
              <li>Stine trives med fleksible rammer – men mister let overblikket.</li>
              <li>Mads trives med klare aftaler – men kan blive rigid.</li>
              <li>→ Lav systemer, der balancerer valgfrihed og tryghed.</li>
            </ul>
          </li>
          <li>
            <strong>Styrk kontakten mellem tempoerne:</strong>
            <ul className="list-disc pl-6 mt-2">
              <li>Stine reagerer hurtigt og følelsesbaseret.</li>
              <li>Mads tænker dybt og har brug for tid.</li>
              <li>→ Indfør pauser og check-ins, hvor I tuner ind på hinanden.</li>
            </ul>
          </li>
          <li>
            <strong>Anerkend hinandens kernebehov – og nedgør dem ikke:</strong>
            <ul className="list-disc pl-6 mt-2">
              <li>Stines behov for dopamin og intensitet er ægte – ikke uansvarligt.</li>
              <li>Mads' behov for tryghed og ro er ægte – ikke kontrol.</li>
              <li>→ Når I forstår behovene, bliver de mindre farlige.</li>
            </ul>
          </li>
        </ol>

        <h3 className="mt-10">❤️ Jeres fælles mulighed</h3>
        <p>
          I har begge en stærk vilje til kærlighed og nærhed – men kommer derhen på meget forskellige måder.
          Hvis I tør tage forskelligheden ind som et fælles projekt, ikke som en kamp,
          så kan I skabe en relation med både dybde og glød.
        </p>
      </Card>
    </div>
  );
}
