import React from 'react';

interface AvatarSelectionProps {
  selectedAvatar: string;
  onSelect: (avatarUrl: string) => void;
}

export const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedAvatar, onSelect }) => {
  
  // Using DiceBear 'Micah' style for a poppy, artistic, human-like look
  // We construct the URLs with specific seeds and options to get consistent characters with glasses and cool hair
  const presets = [
    {
      // Male, Cool Hair (Fonze), No Glasses
      id: 'https://api.dicebear.com/9.x/micah/svg?seed=Felix&hair=fonze&backgroundColor=f0fdf4&baseColor=f97316',
      label: 'The Artist',
    },
    {
      // Female, Cool Hair (Pixie), No Glasses
      id: 'https://api.dicebear.com/9.x/micah/svg?seed=Aneka&hair=pixie&backgroundColor=fff7ed&baseColor=15803d',
      label: 'The Explorer',
    },
    {
      // Male, Cool Hair (Fonze - Short), Glasses
      id: 'https://api.dicebear.com/9.x/micah/svg?seed=Leo&hair=fonze&glasses=round&glassesProbability=100&backgroundColor=f0fdf4&baseColor=ea580c',
      label: 'The Maker',
    },
    {
      // Female, Cool Hair (Full), Glasses
      id: 'https://api.dicebear.com/9.x/micah/svg?seed=Sorelle&hair=full&glasses=round&glassesProbability=100&backgroundColor=fff7ed&baseColor=166534',
      label: 'The Dreamer',
    }
  ];

  return (
    <div className="flex justify-center gap-4">
      {presets.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={`relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 ${
            selectedAvatar === avatar.id 
              ? 'ring-4 ring-juice-orange scale-110 shadow-lg' 
              : 'ring-2 ring-transparent hover:ring-juice-cream/50 opacity-80 hover:opacity-100 hover:scale-105'
          }`}
          title={avatar.label}
        >
          <img 
            src={avatar.id} 
            alt={avatar.label}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
};
