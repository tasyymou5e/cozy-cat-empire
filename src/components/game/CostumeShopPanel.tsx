import { useState } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { COSTUMES, Costume, COSTUME_RARITY_COLORS, getCostumeById } from '@/types/costumes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Shirt, Sparkles } from 'lucide-react';

interface CostumeShopPanelProps {
  cats: Cat[];
  money: number;
  ownedCostumes: string[]; // Costume IDs
  catCostumes: Record<string, string>; // catId -> costumeId
  onBuyCostume: (costumeId: string) => void;
  onEquipCostume: (catId: string, costumeId: string | null) => void;
}

const catEmojis: Record<string, string> = {
  'stray': '🐱', 'tabby': '🐈', 'persian': '😺', 'siamese': '😸',
  'maine-coon': '🦁', 'british-shorthair': '🐾', 'ragdoll': '💫', 'bengal': '🐆',
};

export function CostumeShopPanel({ 
  cats, 
  money, 
  ownedCostumes, 
  catCostumes, 
  onBuyCostume, 
  onEquipCostume 
}: CostumeShopPanelProps) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);

  const categories = ['hat', 'outfit', 'accessory', 'special'] as const;
  const categoryEmojis = { hat: '🎩', outfit: '👔', accessory: '💍', special: '✨' };

  const CostumeCard = ({ costume, owned }: { costume: Costume; owned: boolean }) => (
    <div className={`p-3 rounded-lg border ${
      owned 
        ? 'border-green-400 bg-green-50/50 dark:bg-green-900/20' 
        : costume.vipExclusive 
          ? 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10' 
          : 'border-border bg-card'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{costume.emoji}</span>
        <div className="flex gap-1">
          {costume.vipExclusive && (
            <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] px-1">
              VIP
            </Badge>
          )}
          <Badge className={COSTUME_RARITY_COLORS[costume.rarity]}>
            {costume.rarity}
          </Badge>
        </div>
      </div>
      <h4 className="font-semibold text-sm">{costume.name}</h4>
      <p className="text-xs text-muted-foreground mb-2">{costume.description}</p>
      <div className="flex gap-2 text-xs mb-2">
        <span className="text-yellow-600">🏆 +{costume.showBonus}%</span>
        <span className="text-pink-600">😊 +{costume.happinessBonus}</span>
      </div>
      {owned ? (
        <Badge variant="outline" className="w-full justify-center text-green-600">
          ✓ Owned
        </Badge>
      ) : costume.vipExclusive ? (
        <Badge variant="outline" className="w-full justify-center text-amber-600 text-xs">
          🔒 {costume.minStreak}+ day streak
        </Badge>
      ) : (
        <Button
          size="sm"
          className="w-full"
          disabled={money < costume.price}
          onClick={() => onBuyCostume(costume.id)}
        >
          Buy ${costume.price}
        </Button>
      )}
    </div>
  );

  const selectedCat = selectedCatId ? cats.find(c => c.id === selectedCatId) : null;
  const equippedCostume = selectedCat && catCostumes[selectedCat.id] 
    ? getCostumeById(catCostumes[selectedCat.id]) 
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Costume Shop</h3>
        </div>
        <Badge variant="outline" className="font-bold">${money}</Badge>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shop" className="text-xs">
            <ShoppingBag className="h-3 w-3 mr-1" /> Shop
          </TabsTrigger>
          <TabsTrigger value="equip" className="text-xs">
            <Shirt className="h-3 w-3 mr-1" /> Equip ({ownedCostumes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-3">
          <Tabs defaultValue="hat">
            <TabsList className="grid w-full grid-cols-4 h-8">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs px-1">
                  {categoryEmojis[cat]}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category} value={category} className="mt-2">
                <ScrollArea className="h-[280px]">
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {COSTUMES.filter(c => c.category === category && !c.vipExclusive).map(costume => (
                      <CostumeCard 
                        key={costume.id} 
                        costume={costume} 
                        owned={ownedCostumes.includes(costume.id)} 
                      />
                    ))}
                  </div>
                  {/* VIP Exclusive Section */}
                  {COSTUMES.filter(c => c.category === category && c.vipExclusive).length > 0 && (
                    <>
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-amber-500/30" />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">✨ VIP Exclusive</span>
                        <div className="flex-1 h-px bg-amber-500/30" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pr-2">
                        {COSTUMES.filter(c => c.category === category && c.vipExclusive).map(costume => (
                          <CostumeCard 
                            key={costume.id} 
                            costume={costume} 
                            owned={ownedCostumes.includes(costume.id)} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="equip" className="mt-3">
          {ownedCostumes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No costumes owned yet!</p>
              <p className="text-xs">Buy some from the shop.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select a cat to dress up:</p>
              
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-2">
                  {cats.map(cat => {
                    const costume = catCostumes[cat.id] ? getCostumeById(catCostumes[cat.id]) : null;
                    return (
                      <div 
                        key={cat.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors
                          ${selectedCatId === cat.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          setEquipDialogOpen(true);
                        }}
                      >
                        <div className="relative">
                          <span className="text-2xl">{catEmojis[cat.breed]}</span>
                          {costume && (
                            <span className="absolute -top-1 -right-1 text-sm">{costume.emoji}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {costume ? `Wearing: ${costume.name}` : 'No costume'}
                          </p>
                        </div>
                        <Shirt className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedCat && (
                        <>
                          <span className="text-2xl">{catEmojis[selectedCat.breed]}</span>
                          Dress up {selectedCat.name}
                        </>
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {selectedCat && (
                    <div className="space-y-3">
                      {equippedCostume && (
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Currently wearing:</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{equippedCostume.emoji}</span>
                            <span>{equippedCostume.name}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2 w-full"
                            onClick={() => {
                              onEquipCostume(selectedCat.id, null);
                              setEquipDialogOpen(false);
                            }}
                          >
                            Remove Costume
                          </Button>
                        </div>
                      )}
                      
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-2">
                          {ownedCostumes
                            .filter(id => !catCostumes[selectedCat.id] || catCostumes[selectedCat.id] !== id)
                            .map(id => {
                              const costume = getCostumeById(id);
                              if (!costume) return null;
                              return (
                                <div 
                                  key={costume.id}
                                  className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer"
                                  onClick={() => {
                                    onEquipCostume(selectedCat.id, costume.id);
                                    setEquipDialogOpen(false);
                                  }}
                                >
                                  <span className="text-xl">{costume.emoji}</span>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{costume.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      🏆 +{costume.showBonus}% | 😊 +{costume.happinessBonus}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
