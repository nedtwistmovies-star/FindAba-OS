export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  return res.status(200).json({
    message: "GitHub callback received",
    code,
  });
}
