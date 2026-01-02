import { useGameState } from '@/hooks/useGameState';
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { ActionPanel } from './ActionPanel';
import { CatCard } from './CatCard';
import { Button } from '@/components/ui/button';

export function CatFarm() {
  const { state, message, actions } = useGameState();

  return (
    <div className="min-h-screen bg-background">
      <header className="game-header">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          🐱 Cat Farm
        </h1>
        <Button variant="ghost" size="sm" onClick={actions.resetGame}>
          New Game
        </Button>
      </header>

      <StatusBar state={state} />
      <MessageBar message={message} />

      <main className="game-main">
        <section className="cat-grid-section">
          <h2 className="text-xl font-bold mb-4 text-foreground">Your Cats</h2>
          {state.cats.length === 0 ? (
            <div className="empty-state">
              <span className="text-6xl mb-4">🐾</span>
              <p className="text-muted-foreground">No cats yet! Add one to get started.</p>
            </div>
          ) : (
            <div className="cat-grid">
              {state.cats.map(cat => (
                <CatCard key={cat.id} cat={cat} onSell={actions.sellCat} />
              ))}
            </div>
          )}
        </section>

        <aside className="action-sidebar">
          <ActionPanel
            onAddCat={actions.addCat}
            onChores={actions.doChores}
            onFeed={actions.feedCats}
            onCatShow={actions.catShow}
            onUpgrade={actions.upgradeHouse}
            onNextDay={actions.nextDay}
            money={state.money}
            catCount={state.cats.length}
          />
        </aside>
      </main>
    </div>
  );
}
