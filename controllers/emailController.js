export const suscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        includeListIds: [6], // instead of listIds
        templateId: 3, // confirmation email template
        redirectionUrl: "http://46.225.161.233/posts", // clean URL, no extra text
      }),
    });

    const data = await response.json();
    console.log("Brevo response:", JSON.stringify(data)); // see what's happening

    if (!response.ok) {
      const error = await response.json();
      // Contact exists but unconfirmed, not a real error
      if (error.code === "duplicate_parameter") {
        return res
          .status(200)
          .json({ message: "Please check your email to confirm" });
      }
      throw new Error(error.message);
    }

    res.status(201).json({ email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
