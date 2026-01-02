import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { ActionPanel } from './ActionPanel';
import { ResourcePanel } from './ResourcePanel';
import { ChorePanel } from './ChorePanel';
import { MarketPanel } from './MarketPanel';
import { CatCard } from './CatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CatFarm() {
  const { state, message, messageType, actions } = useGameState();
  const [sideTab, setSideTab] = useState('actions');

  return (
    <div className="min-h-screen bg-background">
      <header className="game-header">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            🐱 Cat Farm
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Build your 100-acre cat empire!
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={actions.resetGame}>
          New Game
        </Button>
      </header>

      <StatusBar 
        state={state} 
        onUpgrade={actions.upgradeHouse}
        onCatShow={actions.catShow}
      />
      <MessageBar message={message} type={messageType} />

      <main className="game-main">
        <section className="cat-grid-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
            <span className="text-sm text-muted-foreground">
              {state.cats.length} / {state.space} capacity
            </span>
          </div>
          
          {state.cats.length === 0 ? (
            <div className="empty-state">
              <span className="text-6xl mb-4">🐾</span>
              <p className="text-muted-foreground mb-2">No cats yet!</p>
              <p className="text-sm text-muted-foreground">Add a stray for free or buy from the market.</p>
            </div>
          ) : (
            <div className="cat-grid">
              {state.cats.map(cat => (
                <CatCard 
                  key={cat.id} 
                  cat={cat} 
                  onSell={actions.sellCat}
                  onHeal={actions.useMedicine}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="action-sidebar">
          <Tabs value={sideTab} onValueChange={setSideTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="actions" className="text-xs">🐾</TabsTrigger>
              <TabsTrigger value="chores" className="text-xs">🧹</TabsTrigger>
              <TabsTrigger value="supplies" className="text-xs">📦</TabsTrigger>
              <TabsTrigger value="market" className="text-xs">🛒</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="mt-0">
              <ActionPanel
                onAddCat={actions.addCat}
                onNextDay={actions.nextDay}
                money={state.money}
                space={state.space}
                catCount={state.cats.length}
              />
            </TabsContent>
            
            <TabsContent value="chores" className="mt-0">
              <ChorePanel onDoChore={actions.doChore} />
            </TabsContent>
            
            <TabsContent value="supplies" className="mt-0">
              <ResourcePanel
                resources={state.resources}
                money={state.money}
                catCount={state.cats.length}
                onBuyResource={actions.buyResource}
                onFeedCats={actions.feedCats}
                onUseToys={actions.useToys}
              />
            </TabsContent>
            
            <TabsContent value="market" className="mt-0">
              <MarketPanel
                listings={state.marketListings}
                money={state.money}
                hasSpace={state.cats.length < state.space}
                onBuy={actions.buyFromMarket}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
    </div>
  );
}
