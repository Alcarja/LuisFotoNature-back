import { generatePresignedUrl, confirmUpload, deleteImages } from "../services/uploadService.js";

export const getPresignedUrl = async (req, res) => {
  try {
    const { filename, contentType, postId } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: "filename and contentType are required",
      });
    }

    const { presignedUrl, publicUrl } = await generatePresignedUrl(
      filename,
      contentType,
      postId
    );

    res.status(200).json({
      presignedUrl,
      publicUrl,
    });
  } catch (error) {
    console.error("Error in getPresignedUrl:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmImageUpload = async (req, res) => {
  try {
    const { publicUrl, filename, contentType, context } = req.body;

    if (!publicUrl || !filename || !contentType || !context) {
      return res.status(400).json({
        success: false,
        message: "publicUrl, filename, contentType, and context are required",
      });
    }

    if (!["featured", "post-body"].includes(context)) {
      return res.status(400).json({
        success: false,
        message: 'context must be either "featured" or "post-body"',
      });
    }

    const result = await confirmUpload(publicUrl, filename, contentType, context);

    res.status(200).json({
      success: result.success,
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    console.error("Error in confirmImageUpload:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUploadedImages = async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "imageUrls array is required and must not be empty",
      });
    }

    const result = await deleteImages(imageUrls);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteUploadedImages:", error);
    res.status(200).json({
      success: true,
      deleted: 0,
      failed: imageUrls.length,
      message: "Delete request processed with errors",
    });
  }
};
