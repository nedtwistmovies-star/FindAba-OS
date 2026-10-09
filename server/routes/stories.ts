import { Router } from "express";
import { ensureAdmin } from "../middleware/admin";
import { 
  getAggregatedStories, 
  scrapeAndAggregateStories, 
  addCustomStory, 
  incrementStoryLike,
  updateStoryStatus,
  recordStoryCorrection,
  retractStory,
  StoryContentType,
  StoryPublicationStatus
} from "../services/storyScraper";

export const storiesRouter = Router();

/**
 * GET /api/stories
 * Fetches active Aba Stories with optional contentType and status filters.
 */
storiesRouter.get("/", async (req, res) => {
  try {
    const contentType = req.query.type as StoryContentType | undefined;
    const status = req.query.status as StoryPublicationStatus | undefined;

    const data = getAggregatedStories({ contentType, status });
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
 * Triggers media aggregation for authentic stories.
 * Restricted to Administrators.
 */
storiesRouter.post("/refresh", ensureAdmin, async (req, res) => {
  try {
    const result = await scrapeAndAggregateStories();
    const data = getAggregatedStories();
    res.json({
      success: true,
      message: "Aba Stories refreshed with authentic narratives from community feeds.",
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
 * Submits a new story, defaulting to 'awaiting_editorial_review'.
 */
storiesRouter.post("/", async (req, res) => {
  try {
    const { 
      title, 
      media_url, 
      media_type, 
      author_name, 
      author_role, 
      location, 
      description, 
      category, 
      business_name, 
      contact_phone,
      contentType,
      is_illustrative_media
    } = req.body;

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
      contact_phone,
      contentType,
      is_illustrative_media
    });

    res.status(201).json({
      success: true,
      message: "Story submitted for editorial verification.",
      story: created
    });
  } catch (err: any) {
    console.error("[Stories API] Submit error:", err.message);
    res.status(500).json({ error: "Failed to publish story" });
  }
});

/**
 * PATCH /api/stories/:id/status
 * Updates the publication status and editorial notes of a story.
 * Restricted to Administrators.
 */
storiesRouter.patch("/:id/status", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, editorialNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const updated = updateStoryStatus(id, status, editorialNotes);
    if (!updated) {
      return res.status(404).json({ error: "Story not found." });
    }

    res.json({
      success: true,
      message: `Story status updated to ${status}.`,
      story: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update story status" });
  }
});

/**
 * POST /api/stories/:id/correction
 * Records a formal editorial correction on a published story.
 * Restricted to Administrators.
 */
storiesRouter.post("/:id/correction", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details, correctedBy } = req.body;

    if (!details || !reason) {
      return res.status(400).json({ error: "Reason and details are required to record a correction." });
    }

    const updated = recordStoryCorrection(id, {
      date: new Date().toISOString(),
      correctedBy: correctedBy || "Editorial Desk",
      reason,
      details
    });

    if (!updated) {
      return res.status(404).json({ error: "Story not found." });
    }

    res.json({
      success: true,
      message: "Editorial correction recorded.",
      story: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to record correction" });
  }
});

/**
 * POST /api/stories/:id/retract
 * Retracts a story with an explanation.
 * Restricted to Administrators.
 */
storiesRouter.post("/:id/retract", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Retraction reason is required." });
    }

    const updated = retractStory(id, reason);
    if (!updated) {
      return res.status(404).json({ error: "Story not found." });
    }

    res.json({
      success: true,
      message: "Story retracted.",
      story: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retract story" });
  }
});

/**
 * POST /api/stories/:id/like
 * Increments like/salute count for a story.
 */
storiesRouter.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const newLikes = incrementStoryLike(id);
    res.json({ success: true, storyId: id, likes_count: newLikes });
  } catch {
    res.status(500).json({ error: "Failed to record salute" });
  }
});
