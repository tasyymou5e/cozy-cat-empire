

## Improve Empire AI Render Prompts

### Current Problems

The current `buildEmpirePrompt` function has issues that lead to poor image generation:

1. **Vague scene framing** — says "Create a beautiful scene" with no camera angle, composition guidance, or negative constraints
2. **No negative prompts** — nothing tells the model to avoid squiggly lines, abstract patterns, text, watermarks, or deformed anatomy
3. **Cat descriptions are too wordy** — long natural-language paragraphs confuse image models; they work better with concise comma-separated tags
4. **Missing composition anchoring** — no guidance on where cats should be placed relative to the camera (foreground, middle, background)
5. **"Studio Ghibli meets mobile game" is overused** — this phrase is so common that models tend to produce generic results with wobbly linework and squiggle artifacts
6. **No explicit "no text" instruction** — image models often add random text/letters to scenes

### Proposed Prompt Rewrite

**File:** `supabase/functions/generate-empire-scene/index.ts` — rewrite `buildEmpirePrompt`, `TIER_DESCRIPTIONS`, `TIME_LIGHTING`, and `STYLE REQUIREMENTS` section.

**Key changes:**

1. **Replace the style directive** — swap "Studio Ghibli meets mobile game" for a more specific art direction:
   - `"Digital illustration, soft watercolor rendering with clean vector outlines, children's picture book aesthetic, Pixar-quality lighting, no sketchy or squiggly lines"`

2. **Add explicit negative constraints** at the end of the prompt:
   - `"AVOID: squiggly lines, rough sketches, abstract patterns, text or letters anywhere in the image, deformed cat anatomy, extra limbs, blurry faces, watermarks, signatures, borders, vignettes"`

3. **Tighten tier descriptions** — make them more visual-tag oriented:
   - Apartment: `"Warm cozy apartment interior, honey-amber walls, oak hardwood floor, large window showing city skyline at dusk, potted monstera plant, knitted blankets on couch, cat tree by window, soft rug, bookshelf with trinkets"`
   - House: `"Bright suburban living room, cream walls, plush carpet, bay window with garden view, stone fireplace with crackling fire, overstuffed sofa, cat tower, potted ferns, sunlight streaming in"`
   - Mansion: `"Grand luxury parlor, pale lavender walls with gold trim, white marble floor, crystal chandelier, marble columns, grand piano, velvet chaise lounge, ornate gold-framed paintings, fresh flower arrangements"`
   - Farm: `"Pastoral countryside scene, rolling emerald hills, bright blue sky with fluffy clouds, red barn in midground, wooden post fences, golden hay bales, old windmill, apple orchard, warm sunlit grass"`

4. **Simplify cat descriptions** — use comma-separated attribute tags instead of sentences:
   - Before: `"Luna" - a medium-haired warm marmalade orange tabby pattern persian cat with green eyes, flat round face...`
   - After: `Cat 1 "Luna": persian, medium fur, marmalade orange, tabby markings, green eyes, flat face — sitting on the couch`

5. **Add composition direction**:
   - `"COMPOSITION: Wide 16:9 panoramic view, slight low-angle camera, depth of field with sharp foreground cats and soft background details, warm rim lighting on cat fur edges"`

6. **Add a scene-activity line** based on cat count to make images more dynamic:
   - 1 cat: "The cat is lounging peacefully"
   - 2-3 cats: "Cats are relaxing together, one grooming the other"
   - 4+ cats: "Cats are scattered naturally — some napping, some playing, some perched high"

### Files to Modify
- `supabase/functions/generate-empire-scene/index.ts` — rewrite prompt-building functions only; no changes to auth, upload, or API logic

