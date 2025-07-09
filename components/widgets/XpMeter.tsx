import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useXp } from '@/context/XpContext';

export default function XpMeter({ height, layout }: { height: string; layout: string; }) {
  const { xp, levelLength } = useXp();

  const safeXp = typeof xp === "number" && !isNaN(xp) ? xp : 0;
  const safeLevelLength = typeof levelLength === "number" && levelLength > 0 ? levelLength : 100;

  // Level starter ved 1, men man rykker op når xp >= level*levelLength
  const level = Math.floor(safeXp / safeLevelLength) + 1;
  const prevLevelXp = (level - 1) * safeLevelLength;
  const progressValue = safeXp - prevLevelXp; // Progress i NUVÆRENDE level
  const progress = progressValue / safeLevelLength;

  // Vælg farve baseret på progress
  let pathColor = "#F59E42"; // orange
  if (progress >= 0.67) pathColor = "#10B981"; // grøn
  else if (progress >= 0.34) pathColor = "#FACC15"; // gul

  const sizeClass = `
    w-[40vw] h-[40vw]
    max-w-[300px] max-h-[300px]
    min-w-[120px] min-h-[120px]
    mx-auto
    relative
  `;

  return (
    <Card className="text-center shadow flex flex-col justify-center relative">
      <div className="flex items-center justify-center pt-5 pb-2">
        <h2 className="text-xl font-bold text-indigo-700 mx-auto">XP-meter</h2>
        <div className="absolute right-6 top-6 sm:right-10 sm:top-6">
          <span className="bg-indigo-600 text-white rounded-full px-5 py-1 text-md font-bold shadow">
            Level {level}
          </span>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col items-center space-y-8">
        <div className={sizeClass}>
          <CircularProgressbar
            value={progressValue}
            maxValue={safeLevelLength}
            text={`${safeXp} XP`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: pathColor,
              textColor: '#374151',
              trailColor: '#D1D5DB',
              strokeLinecap: "round",
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
