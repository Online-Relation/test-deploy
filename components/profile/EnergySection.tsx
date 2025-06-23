// /components/profile/EnergySection.tsx

import { FC } from 'react';
import { DopaminList } from '@/components/DopaminList';

interface EnergySectionProps {
  dopaminList: string[];
  setDopaminList: (list: string[]) => void;
  handleSaveSizes: () => void;
}

export const EnergySection: FC<EnergySectionProps> = ({
  dopaminList,
  setDopaminList,
  handleSaveSizes,
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold">⚡ Min energi og dopamin</h2>
      <p className="text-sm text-gray-500 mb-4">Her kan du tilføje ting, der giver dig energi og dopamin.</p>

      <DopaminList
        value={dopaminList}
        onChange={(list) => setDopaminList(list)}
      />

      <button
        onClick={handleSaveSizes}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-6"
      >
        Gem energi
      </button>
    </>
  );
};
