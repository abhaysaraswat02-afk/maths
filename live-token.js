export default function handler(req, res) {
  try {
    const token = Math.random().toString(36).substring(2);

    res.status(200).json({
      token: token
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}