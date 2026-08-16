import { Router } from "express";
import { 
  getAggregatedStories, 
  scrapeAndAggregateStories, 
  addCustomStory, 
  incrementStoryLike 
} from "../services/storyScraper";

export const storiesRouter = Router();

/**
 * GET /api/stories
 * Fetches all active Aba Stories (documentaries, reels, pictorial essays, community stories).
 */
storiesRouter.get("/", async (req, res) => {
  try {
    const data = getAggregatedStories();
    res.json({
      success: true,
      count: data.stories.length,
      lastUpdated: data.lastUpdated,
      totalRuns: data.totalRuns,
      stories: data.stories,
    });
  } catch (err: any) {
    console.error("[Stories API] Error fetching stories:", err.message);
    res.status(500).json({ error: "Failed to load Aba Stories" });
  }
});

/**
 * POST /api/stories/refresh
 * Triggers the background scraper job to pull fresh visual stories from connected feeds.
 */
storiesRouter.post("/refresh", async (req, res) => {
  try {
    const result = await scrapeAndAggregateStories();
    const data = getAggregatedStories();
    res.json({
      success: true,
      message: "Aba Stories refreshed with fresh visual narratives from social feeds.",
      count: result.count,
      timestamp: result.timestamp,
      stories: data.stories,
    });
  } catch (err: any) {
    console.error("[Stories API] Refresh failure:", err.message);
    res.status(500).json({ error: err.message || "Failed to refresh stories" });
  }
});

/**
 * POST /api/stories
 * Submits a new Aba Story.
 */
storiesRouter.post("/", async (req, res) => {
  try {
    const { title, media_url, media_type, author_name, author_role, location, description, category, business_name, contact_phone } = req.body;
    if (!title || !media_url) {
      return res.status(400).json({ error: "Title and valid Media URL are required." });
    }

    const created = addCustomStory({
      title,
      media_url,
      media_type,
      author_name,
      author_role,
      location,
      description,
      category,
      business_name,
      contact_phone
    });

    res.status(201).json({
      success: true,
      message: "Story published to Aba Stories reel!",
      story: created
    });
  } catch (err: any) {
    console.error("[Stories API] Submit error:", err.message);
    res.status(500).json({ error: "Failed to publish story" });
  }
});

/**
 * POST /api/stories/:id/like
 * Increments salute count for a story.
 */
storiesRouter.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const newLikes = incrementStoryLike(id);
    res.json({ success: true, storyId: id, likes_count: newLikes });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record salute" });
  }
});
