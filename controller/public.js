
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
// const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";

// exports.startApi = (req, res) => {
//   res.status(200).json({ message: "Welcome To Vidown Api" });
// };

// const outputDir = path.join(__dirname, "..", "downloads");

// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir, { recursive: true });
// }

// const sanitizeFileName = (value = "linkflow-download") => {
//   const cleaned = String(value || "linkflow-download")
//     .normalize("NFKD")
//     .replace(/[^\x20-\x7E]/g, "")
//     .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 80);

//   return cleaned || "linkflow-download";
// };

// const encodeRFC5987ValueChars = (value) => {
//   return encodeURIComponent(value)
//     .replace(/['()*]/g, (char) =>
//       `%${char.charCodeAt(0).toString(16).toUpperCase()}`
//     )
//     .replace(/%(7C|60|5E)/g, (match) => match.toLowerCase());
// };

// const createContentDisposition = (filename) => {
//   const fallbackName = sanitizeFileName(filename || "linkflow-download");
//   const encodedName = encodeRFC5987ValueChars(filename || fallbackName);

//   return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
// };

// const getContentType = (filePath) => {
//   const ext = path.extname(filePath).toLowerCase();

//   if (ext === ".mp3") return "audio/mpeg";
//   if (ext === ".m4a") return "audio/mp4";
//   if (ext === ".webm") return "video/webm";
//   if (ext === ".mp4") return "video/mp4";

//   return "application/octet-stream";
// };

// const safeDeleteFile = (filePath) => {
//   if (!filePath) return;

//   fs.unlink(filePath, () => {});
// };

// const isClientDisconnected = (res) => {
//   return res.destroyed || res.writableEnded || res.headersSent;
// };

// const sendJsonIfConnected = (res, statusCode, payload) => {
//   if (res.destroyed || res.writableEnded || res.headersSent) {
//     return;
//   }

//   return res.status(statusCode).json(payload);
// };

// const getCleanProcessError = (stderr = "") => {
//   const text = String(stderr || "").trim();

//   if (!text) return "Process stopped before completion.";

//   const lines = text
//     .split("\n")
//     .map((line) => line.trim())
//     .filter(Boolean);

//   const importantLine =
//     lines
//       .reverse()
//       .find((line) =>
//         /error|failed|invalid|unable|not found|permission|denied/i.test(line)
//       ) || lines[0];

//   return importantLine || "Download process failed.";
// };

// const sendPreparedFile = (res, filePath, downloadName) => {
//   if (!fs.existsSync(filePath)) {
//     return sendJsonIfConnected(res, 500, {
//       status: "fail",
//       code: "PREPARED_FILE_NOT_FOUND",
//       error: "Prepared file not found.",
//     });
//   }

//   const stat = fs.statSync(filePath);
//   const finalName = downloadName || path.basename(filePath);

//   res.setHeader("Content-Type", getContentType(filePath));
//   res.setHeader("Content-Length", stat.size);
//   res.setHeader("Content-Disposition", createContentDisposition(finalName));

//   const stream = fs.createReadStream(filePath);

//   stream.pipe(res);

//   stream.on("close", () => {
//     setTimeout(() => {
//       safeDeleteFile(filePath);
//     }, 60 * 1000);
//   });

//   stream.on("error", (err) => {
//     console.log("File stream error:", err.message);

//     if (!res.headersSent) {
//       sendJsonIfConnected(res, 500, {
//         status: "fail",
//         code: "FILE_STREAM_FAILED",
//         error: "Failed to stream file.",
//       });
//     }
//   });
// };

// const isMetricOnlyTitle = (value = "") => {
//   const text = String(value).trim().toLowerCase();

//   if (!text) return true;

//   return (
//     /^\d+(\.\d+)?[kmb]?\s+(views|reactions|shares|comments)/i.test(text) ||
//     text.includes("reactions") ||
//     text.includes("shares") ||
//     text === "follow" ||
//     text === "like" ||
//     text.length < 3
//   );
// };

// const getCleanTitle = (data = {}) => {
//   const rawTitle = data.title || data.fulltitle || "";
//   const description = data.description || "";
//   const uploader = data.uploader || "";

//   const lines = description
//     .split("\n")
//     .map((line) => line.replace(/\s+/g, " ").trim())
//     .filter(Boolean);

//   let title =
//     lines.find((line) => !isMetricOnlyTitle(line)) ||
//     rawTitle ||
//     uploader ||
//     "Video";

//   title = title
//     .replace(/\s+/g, " ")
//     .replace(
//       /^\d+(\.\d+)?[KMB]?\s+views\s*·\s*\d+(\.\d+)?[KMB]?\s+reactions\s*\|\s*/i,
//       ""
//     )
//     .replace(/^\d+(\.\d+)?[KMB]?\s+views\s*\|\s*/i, "")
//     .replace(
//       /^\d+(\.\d+)?[KMB]?\s+reactions\s*·\s*\d+(\.\d+)?[KMB]?\s+shares/i,
//       ""
//     )
//     .split("Download the app")[0]
//     .split("LINK IN BIO")[0]
//     .split("Cast:")[0]
//     .split("#")[0]
//     .trim();

//   if (title.toLowerCase().includes(" is now streaming")) {
//     title = title.split(/ is now streaming/i)[0].trim();
//   }

//   if (isMetricOnlyTitle(title)) {
//     title = uploader || "Video";
//   }

//   return title.slice(0, 70) || "Video";
// };

// const formatDuration = (seconds) => {
//   if (
//     seconds === null ||
//     seconds === undefined ||
//     Number.isNaN(Number(seconds))
//   ) {
//     return null;
//   }

//   const totalSeconds = Math.floor(Number(seconds));
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const remainingSeconds = totalSeconds % 60;

//   if (hours > 0) {
//     return `${hours}:${String(minutes).padStart(2, "0")}:${String(
//       remainingSeconds
//     ).padStart(2, "0")}`;
//   }

//   return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
// };

// const formatSize = (bytes, estimated = false) => {
//   const size = Number(bytes);

//   if (!size || Number.isNaN(size) || size <= 0) {
//     return estimated ? "Approx. 1 MB" : "1 MB";
//   }

//   const kb = size / 1024;
//   const mb = kb / 1024;
//   const gb = mb / 1024;

//   let label = "";

//   if (gb >= 1) {
//     label = `${gb.toFixed(1)} GB`;
//   } else if (mb >= 100) {
//     label = `${Math.round(mb)} MB`;
//   } else if (mb >= 10) {
//     label = `${mb.toFixed(1)} MB`;
//   } else if (mb >= 1) {
//     label = `${mb.toFixed(1)} MB`;
//   } else {
//     label = `${Math.max(1, Math.round(kb))} KB`;
//   }

//   return estimated ? `Approx. ${label}` : label;
// };

// const getDirectSizeBytes = (item = {}) => {
//   const candidates = [
//     item.filesize,
//     item.filesize_approx,
//     item.size,
//     item.file_size,
//     item.content_length,
//   ];

//   for (const candidate of candidates) {
//     const value = Number(candidate);

//     if (value && !Number.isNaN(value) && value > 0) {
//       return value;
//     }
//   }

//   return null;
// };

// const estimateSizeFromBitrate = (item = {}, durationSeconds) => {
//   const duration = Number(durationSeconds || item.duration || 0);

//   if (!duration || Number.isNaN(duration) || duration <= 0) {
//     return null;
//   }

//   const bitrateKbps =
//     Number(item.tbr || 0) ||
//     Number(item.vbr || 0) ||
//     Number(item.abr || 0) ||
//     Number(item.bitrate || 0);

//   if (!bitrateKbps || Number.isNaN(bitrateKbps) || bitrateKbps <= 0) {
//     return null;
//   }

//   return (bitrateKbps * 1000 * duration) / 8;
// };

// const getEstimatedVideoBitrateKbps = (item = {}) => {
//   const height = Number(item.height || 0);

//   if (height >= 4320) return 35000;
//   if (height >= 2160) return 16000;
//   if (height >= 1440) return 9000;
//   if (height >= 1080) return 5200;
//   if (height >= 720) return 2800;
//   if (height >= 480) return 1300;
//   if (height >= 360) return 800;
//   if (height >= 240) return 450;

//   if (item.width && item.height) return 800;

//   return 600;
// };

// const estimateVideoSizeFromResolution = (item = {}, durationSeconds) => {
//   const duration = Number(durationSeconds || item.duration || 0);

//   if (!duration || Number.isNaN(duration) || duration <= 0) {
//     return null;
//   }

//   let bitrateKbps = getEstimatedVideoBitrateKbps(item);

//   if (String(item.ext || "").toLowerCase() === "webm") {
//     bitrateKbps *= 0.85;
//   }

//   return (bitrateKbps * 1000 * duration) / 8;
// };

// const estimateAudioSize = (item = {}, durationSeconds) => {
//   const duration = Number(durationSeconds || item.duration || 0);

//   if (!duration || Number.isNaN(duration) || duration <= 0) {
//     return null;
//   }

//   const bitrateKbps =
//     Number(item.abr || 0) ||
//     Number(item.tbr || 0) ||
//     Number(item.asr ? 128 : 0) ||
//     128;

//   return (bitrateKbps * 1000 * duration) / 8;
// };

// const getFallbackSizeBytes = (type = "video", durationSeconds) => {
//   const duration = Number(durationSeconds || 0);

//   if (duration && !Number.isNaN(duration) && duration > 0) {
//     if (type === "audio") {
//       return (128 * 1000 * duration) / 8;
//     }

//     return (900 * 1000 * duration) / 8;
//   }

//   if (type === "audio") {
//     return 512 * 1024;
//   }

//   return 2 * 1024 * 1024;
// };

// const getFormatSizeInfo = (item = {}, durationSeconds, type = "video") => {
//   const exactBytes = getDirectSizeBytes(item);

//   if (exactBytes) {
//     return {
//       size: formatSize(exactBytes, false),
//       sizeBytes: Math.round(exactBytes),
//       sizeEstimated: false,
//     };
//   }

//   const bitrateEstimate = estimateSizeFromBitrate(item, durationSeconds);

//   if (bitrateEstimate) {
//     return {
//       size: formatSize(bitrateEstimate, true),
//       sizeBytes: Math.round(bitrateEstimate),
//       sizeEstimated: true,
//     };
//   }

//   const smartEstimate =
//     type === "audio"
//       ? estimateAudioSize(item, durationSeconds)
//       : estimateVideoSizeFromResolution(item, durationSeconds);

//   if (smartEstimate) {
//     return {
//       size: formatSize(smartEstimate, true),
//       sizeBytes: Math.round(smartEstimate),
//       sizeEstimated: true,
//     };
//   }

//   const fallbackSize = getFallbackSizeBytes(type, durationSeconds);

//   return {
//     size: formatSize(fallbackSize, true),
//     sizeBytes: Math.round(fallbackSize),
//     sizeEstimated: true,
//   };
// };

// const getAspectRatio = (width, height, ytAspectRatio) => {
//   if (ytAspectRatio && Number(ytAspectRatio) < 0.8) return "portrait";
//   if (ytAspectRatio && Number(ytAspectRatio) > 1.2) return "landscape";

//   if (
//     ytAspectRatio &&
//     Number(ytAspectRatio) >= 0.8 &&
//     Number(ytAspectRatio) <= 1.2
//   ) {
//     return "square";
//   }

//   if (!width || !height) return "landscape";
//   if (height > width) return "portrait";
//   if (width === height) return "square";

//   return "landscape";
// };

// const getQualityLabel = (item) => {
//   const height = Number(item.height || 0);

//   if (height >= 4320) return "4320p (8K)";
//   if (height >= 2160) return "2160p (4K)";
//   if (height >= 1440) return "1440p (2K)";
//   if (height >= 1080) return "1080p (Full HD)";
//   if (height >= 720) return "720p (HD)";
//   if (height >= 480) return "480p (SD)";
//   if (height >= 360) return "360p";
//   if (height >= 240) return "240p";

//   if (item.width && item.height) {
//     return `${item.width}×${item.height}`;
//   }

//   return item.format_note || item.resolution || item.format_id || "Default";
// };

// const getSortHeight = (quality = "") => {
//   if (quality.includes("4320")) return 4320;
//   if (quality.includes("2160")) return 2160;
//   if (quality.includes("1440")) return 1440;
//   if (quality.includes("1080")) return 1080;
//   if (quality.includes("720")) return 720;
//   if (quality.includes("480")) return 480;
//   if (quality.includes("360")) return 360;
//   if (quality.includes("240")) return 240;

//   return Number(String(quality).match(/\d+/)?.[0]) || 0;
// };

// const normalizeErrorMessage = (stderr = "") => {
//   const lowerError = stderr.toLowerCase();

//   const isFacebookError =
//     lowerError.includes("[facebook]") ||
//     lowerError.includes("facebook") ||
//     lowerError.includes("cannot parse data");

//   const isCookieError =
//     lowerError.includes("cookies") ||
//     lowerError.includes("login") ||
//     lowerError.includes("private") ||
//     lowerError.includes("not available") ||
//     lowerError.includes("sign in");

//   const isUnsupportedError =
//     lowerError.includes("unsupported url") ||
//     lowerError.includes("no suitable extractor");

//   if (isFacebookError) {
//     return {
//       statusCode: 422,
//       code: "FACEBOOK_EXTRACT_FAILED",
//       error:
//         "Facebook could not fully process this link. Try another public reel/video URL.",
//     };
//   }

//   if (isCookieError) {
//     return {
//       statusCode: 401,
//       code: "LOGIN_OR_COOKIES_REQUIRED",
//       error:
//         "This video may require login or cookies. Please try a public video link.",
//     };
//   }

//   if (isUnsupportedError) {
//     return {
//       statusCode: 400,
//       code: "UNSUPPORTED_URL",
//       error:
//         "This website or link format is not supported. Please try another valid video URL.",
//     };
//   }

//   return {
//     statusCode: 500,
//     code: "MEDIA_EXTRACT_FAILED",
//     error:
//       "Unable to extract this media. Please check the link or try another video.",
//   };
// };

// exports.postMedia = async (req, res, next) => {
//   try {
//     const url = req.body.urls;

//     if (
//       !url ||
//       typeof url !== "string" ||
//       (!url.startsWith("http://") && !url.startsWith("https://"))
//     ) {
//       return res.status(400).json({
//         status: "fail",
//         code: "INVALID_URL",
//         error: "Valid URL is required",
//       });
//     }

//     const ytDlp = spawn(
//       YTDLP_PATH,
//       [
//         "-J",
//         "--no-playlist",
//         "--no-warnings",
//         "--socket-timeout",
//         "20",
//         url,
//       ],
//       {
//         timeout: 45000,
//         windowsHide: true,
//       }
//     );

//     let stdout = "";
//     let stderr = "";
//     let isResponded = false;

//     ytDlp.stdout.on("data", (data) => {
//       stdout += data.toString();
//     });

//     ytDlp.stderr.on("data", (data) => {
//       stderr += data.toString();
//     });

//     ytDlp.on("error", (err) => {
//       if (isResponded) return;
//       isResponded = true;

//       console.log("yt-dlp process error:", err.message);

//       return res.status(500).json({
//         status: "fail",
//         code: "YTDLP_NOT_FOUND",
//         error:
//           "yt-dlp is not installed or failed to start. Please install or update yt-dlp on the server.",
//       });
//     });

//     ytDlp.on("close", async (code) => {
//       if (isResponded) return;

//       let data = null;

//       if (stdout) {
//         try {
//           data = JSON.parse(stdout);
//         } catch {
//           data = null;
//         }
//       }

//       if (code !== 0 && !data) {
//         isResponded = true;

//         const friendlyError = normalizeErrorMessage(stderr);

//         return res.status(friendlyError.statusCode).json({
//           status: "fail",
//           code: friendlyError.code,
//           error: friendlyError.error,
//           details: stderr || "Unknown yt-dlp error",
//         });
//       }

//       if (!data) {
//         isResponded = true;

//         return res.status(500).json({
//           status: "fail",
//           code: "INVALID_YTDLP_RESPONSE",
//           error: "Invalid yt-dlp response. Please try another video link.",
//         });
//       }

//       const allFormats = Array.isArray(data.formats) ? data.formats : [];

//       const audioFormats = allFormats
//         .filter((item) => {
//           return (
//             item.url &&
//             item.acodec &&
//             item.acodec !== "none" &&
//             (!item.vcodec || item.vcodec === "none")
//           );
//         })
//         .map((item) => {
//           const sizeInfo = getFormatSizeInfo(item, data.duration, "audio");

//           return {
//             type: "audio",
//             url: item.url,
//             quality:
//               item.abr || item.asr
//                 ? `${Math.round(item.abr || item.asr)} kbps`
//                 : item.format_note || "Audio",
//             ext: item.ext || "m4a",
//             size: sizeInfo.size,
//             sizeBytes: sizeInfo.sizeBytes,
//             sizeEstimated: sizeInfo.sizeEstimated,
//             formatId: item.format_id || "",
//             width: null,
//             height: null,
//             fps: null,
//             vcodec: item.vcodec || "",
//             acodec: item.acodec || "",
//             hasAudio: true,
//             audioUrl: "",
//             audioFormatId: item.format_id || "",
//             aspectRatio: "audio",
//           };
//         })
//         .filter(
//           (item, index, self) =>
//             index ===
//             self.findIndex(
//               (x) => x.quality === item.quality && x.ext === item.ext
//             )
//         )
//         .slice(0, 8);

//       const bestAudio =
//         audioFormats.find((item) => item.ext === "m4a") ||
//         audioFormats[0] ||
//         null;

//       const progressiveVideoFormats = allFormats
//         .filter((item) => {
//           return (
//             item.url &&
//             item.vcodec &&
//             item.vcodec !== "none" &&
//             item.acodec &&
//             item.acodec !== "none" &&
//             ["mp4", "webm"].includes(item.ext)
//           );
//         })
//         .map((item) => {
//           const sizeInfo = getFormatSizeInfo(item, data.duration, "video");

//           return {
//             type: "video",
//             url: item.url,
//             quality: getQualityLabel(item),
//             ext: item.ext || "mp4",
//             size: sizeInfo.size,
//             sizeBytes: sizeInfo.sizeBytes,
//             sizeEstimated: sizeInfo.sizeEstimated,
//             formatId: item.format_id || "",
//             width: item.width || null,
//             height: item.height || null,
//             fps: item.fps || null,
//             vcodec: item.vcodec || "",
//             acodec: item.acodec || "",
//             hasAudio: true,
//             audioUrl: "",
//             audioFormatId: "",
//             aspectRatio: getAspectRatio(
//               item.width,
//               item.height,
//               item.aspect_ratio
//             ),
//           };
//         });

//       const dashVideoFormats = allFormats
//         .filter((item) => {
//           return (
//             item.url &&
//             item.vcodec &&
//             item.vcodec !== "none" &&
//             (!item.acodec || item.acodec === "none") &&
//             ["mp4", "webm"].includes(item.ext)
//           );
//         })
//         .map((item) => {
//           const sizeInfo = getFormatSizeInfo(item, data.duration, "video");

//           return {
//             type: "video",
//             url: item.url,
//             quality: getQualityLabel(item),
//             ext: item.ext || "mp4",
//             size: sizeInfo.size,
//             sizeBytes: sizeInfo.sizeBytes,
//             sizeEstimated: sizeInfo.sizeEstimated,
//             formatId: item.format_id || "",
//             width: item.width || null,
//             height: item.height || null,
//             fps: item.fps || null,
//             vcodec: item.vcodec || "",
//             acodec: item.acodec || "none",
//             hasAudio: false,
//             audioUrl: bestAudio?.url || "",
//             audioFormatId: bestAudio?.formatId || "",
//             aspectRatio: getAspectRatio(
//               item.width,
//               item.height,
//               item.aspect_ratio
//             ),
//           };
//         });

//       const videoFormats = [...progressiveVideoFormats, ...dashVideoFormats]
//         .filter(
//           (item, index, self) =>
//             index ===
//             self.findIndex(
//               (x) =>
//                 x.quality === item.quality &&
//                 x.ext === item.ext &&
//                 x.aspectRatio === item.aspectRatio
//             )
//         )
//         .sort((a, b) => {
//           const byHeight = getSortHeight(b.quality) - getSortHeight(a.quality);

//           if (byHeight !== 0) return byHeight;

//           if (a.ext === "mp4" && b.ext !== "mp4") return -1;
//           if (a.ext !== "mp4" && b.ext === "mp4") return 1;

//           if (a.hasAudio && !b.hasAudio) return -1;
//           if (!a.hasAudio && b.hasAudio) return 1;

//           return Number(b.sizeBytes || 0) - Number(a.sizeBytes || 0);
//         })
//         .slice(0, 10);

//       const bestPreview =
//         videoFormats.find((item) => item.hasAudio && item.ext === "mp4") ||
//         videoFormats.find((item) => item.ext === "mp4") ||
//         videoFormats[0] ||
//         null;

//       isResponded = true;

//       res.status(200).json({
//         status: "success",
//         platform: data.extractor_key || data.extractor || "unknown",
//         title: getCleanTitle(data),
//         originalTitle: data.title || data.fulltitle || "Media",
//         uploader: data.uploader || "",
//         thumb: data.thumbnail || "",
//         duration: data.duration || null,
//         durationText:
//           formatDuration(data.duration) || data.duration_string || "--",
//         viewCount: data.view_count || null,
//         webpage_url: data.webpage_url || url,
//         aspectRatio: bestPreview?.aspectRatio || "landscape",
//         previewUrl: bestPreview?.url || "",
//         previewAudioUrl:
//           bestPreview && !bestPreview.hasAudio ? bestPreview.audioUrl : "",
//         previewHasAudio: Boolean(bestPreview?.hasAudio),
//         video: videoFormats,
//         audio: audioFormats,
//         urls: [...videoFormats, ...audioFormats],
//       });

//       if (req.users) {
//         req.users.addActivity({ mediaUrl: url }).catch((err) => {
//           console.log("Activity save error:", err.message);
//         });
//       }
//     });
//   } catch (err) {
//     console.log("Media API error:", err.message);

//     if (!res.headersSent) {
//       res.status(500).json({
//         status: "fail",
//         code: "SERVER_ERROR",
//         error: "Download failed. Please try again.",
//       });
//     }

//     next(err);
//   }
// };

// exports.downloadDirectMedia = async (req, res) => {
//   let childProcess = null;
//   let hasFinished = false;
//   let clientCancelled = false;
//   let outputPathToClean = "";

//   const cleanupProcess = () => {
//     clientCancelled = true;

//     if (childProcess && !childProcess.killed) {
//       try {
//         childProcess.kill("SIGKILL");
//       } catch {}
//     }

//     if (outputPathToClean) {
//       safeDeleteFile(outputPathToClean);
//     }
//   };

//   req.on("aborted", cleanupProcess);

//   res.on("close", () => {
//     if (!hasFinished) {
//       cleanupProcess();
//     }
//   });

//   try {
//     const {
//       type,
//       title,
//       originalUrl,
//       platform,
//       videoUrl,
//       audioUrl,
//       videoFormatId,
//       audioFormatId,
//       hasAudio,
//     } = req.body;

//     const safeTitle = sanitizeFileName(title || "linkflow-download");
//     const timestamp = Date.now();
//     const extension = type === "audio" ? "mp3" : "mp4";

//     const outputPath = path.join(
//       outputDir,
//       `${safeTitle}-${timestamp}.${extension}`
//     );

//     outputPathToClean = outputPath;

//     const platformName = String(platform || "").toLowerCase();
//     const originalUrlValue = String(originalUrl || "");

//     const shouldUseYtDlp =
//       originalUrlValue &&
//       (platformName.includes("youtube") ||
//         originalUrlValue.includes("youtube.com") ||
//         originalUrlValue.includes("youtu.be"));

//     if (shouldUseYtDlp) {
//       const outputTemplate = path.join(
//         outputDir,
//         `${safeTitle}-${timestamp}.%(ext)s`
//       );

//       const selectedHasAudio = hasAudio === true || hasAudio === "true";

//       const args = [
//         "--no-playlist",
//         "--newline",
//         "--force-overwrites",
//         "--no-warnings",
//         "-N",
//         "4",
//       ];

//       if (type === "audio") {
//         args.push(
//           "-f",
//           audioFormatId || "bestaudio",
//           "-x",
//           "--audio-format",
//           "mp3",
//           "-o",
//           outputTemplate,
//           originalUrlValue
//         );
//       } else {
//         let formatSpec = "bestvideo+bestaudio/best";

//         if (videoFormatId && selectedHasAudio) {
//           formatSpec = `${videoFormatId}/best`;
//         } else if (videoFormatId && audioFormatId) {
//           formatSpec = `${videoFormatId}+${audioFormatId}/${videoFormatId}+bestaudio/best`;
//         } else if (videoFormatId) {
//           formatSpec = `${videoFormatId}+bestaudio/bestvideo+bestaudio/best`;
//         }

//         args.push(
//           "-f",
//           formatSpec,
//           "--merge-output-format",
//           "mp4",
//           "-o",
//           outputTemplate,
//           originalUrlValue
//         );
//       }

//       childProcess = spawn(YTDLP_PATH, args, {
//         timeout: 600000,
//         windowsHide: true,
//       });

//       let stderr = "";
//       let isResponded = false;

//       childProcess.stderr.on("data", (data) => {
//         stderr += data.toString();
//       });

//       childProcess.on("error", (err) => {
//         if (isResponded || clientCancelled || isClientDisconnected(res)) return;

//         isResponded = true;
//         hasFinished = true;

//         console.log("yt-dlp start error:", err.message);

//         return sendJsonIfConnected(res, 500, {
//           status: "fail",
//           code: "YTDLP_DOWNLOAD_START_FAILED",
//           error: "Download engine failed to start.",
//           details: err.message,
//         });
//       });

//       childProcess.on("close", (code, signal) => {
//         if (isResponded) return;

//         if (
//           clientCancelled ||
//           signal === "SIGKILL" ||
//           isClientDisconnected(res)
//         ) {
//           hasFinished = true;
//           safeDeleteFile(outputPathToClean);
//           return;
//         }

//         if (code !== 0) {
//           isResponded = true;
//           hasFinished = true;

//           const cleanError = getCleanProcessError(stderr);
//           console.log("yt-dlp download failed:", cleanError);

//           return sendJsonIfConnected(res, 500, {
//             status: "fail",
//             code: "YTDLP_DOWNLOAD_FAILED",
//             error: "Download was not completed. Please try again.",
//             details: cleanError,
//           });
//         }

//         const files = fs
//           .readdirSync(outputDir)
//           .filter((file) => file.startsWith(`${safeTitle}-${timestamp}`));

//         if (!files.length) {
//           isResponded = true;
//           hasFinished = true;

//           return sendJsonIfConnected(res, 500, {
//             status: "fail",
//             code: "DOWNLOADED_FILE_NOT_FOUND",
//             error: "Prepared file not found.",
//           });
//         }

//         const filePath = path.join(outputDir, files[0]);
//         const finalName = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;

//         outputPathToClean = filePath;
//         isResponded = true;
//         hasFinished = true;

//         return sendPreparedFile(res, filePath, finalName);
//       });

//       return;
//     }

//     if (type === "video" && !videoUrl) {
//       hasFinished = true;

//       return sendJsonIfConnected(res, 400, {
//         status: "fail",
//         code: "VIDEO_URL_REQUIRED",
//         error: "Video URL is required.",
//       });
//     }

//     if (type === "audio" && !audioUrl && !videoUrl) {
//       hasFinished = true;

//       return sendJsonIfConnected(res, 400, {
//         status: "fail",
//         code: "AUDIO_URL_REQUIRED",
//         error: "Audio URL is required.",
//       });
//     }

//     const args = ["-hide_banner", "-loglevel", "error", "-nostdin"];

//     if (type === "audio") {
//       args.push(
//         "-y",
//         "-i",
//         audioUrl || videoUrl,
//         "-vn",
//         "-codec:a",
//         "libmp3lame",
//         "-b:a",
//         "192k",
//         outputPath
//       );
//     } else if (audioUrl) {
//       args.push(
//         "-y",
//         "-i",
//         videoUrl,
//         "-i",
//         audioUrl,
//         "-map",
//         "0:v:0",
//         "-map",
//         "1:a:0",
//         "-c:v",
//         "copy",
//         "-c:a",
//         "aac",
//         "-b:a",
//         "192k",
//         "-movflags",
//         "+faststart",
//         "-shortest",
//         outputPath
//       );
//     } else {
//       args.push(
//         "-y",
//         "-i",
//         videoUrl,
//         "-c",
//         "copy",
//         "-movflags",
//         "+faststart",
//         outputPath
//       );
//     }

//     childProcess = spawn(FFMPEG_PATH, args, {
//       timeout: 600000,
//       windowsHide: true,
//     });

//     let stderr = "";
//     let isResponded = false;

//     childProcess.stderr.on("data", (data) => {
//       stderr += data.toString();
//     });

//     childProcess.on("error", (err) => {
//       if (isResponded || clientCancelled || isClientDisconnected(res)) return;

//       isResponded = true;
//       hasFinished = true;

//       console.log("FFmpeg start error:", err.message);

//       return sendJsonIfConnected(res, 500, {
//         status: "fail",
//         code: "FFMPEG_START_FAILED",
//         error:
//           "Download engine failed to start. Please check FFmpeg installation.",
//         details: err.message,
//       });
//     });

//     childProcess.on("close", (code, signal) => {
//       if (isResponded) return;

//       if (clientCancelled || signal === "SIGKILL" || isClientDisconnected(res)) {
//         hasFinished = true;
//         safeDeleteFile(outputPath);
//         return;
//       }

//       if (code !== 0) {
//         isResponded = true;
//         hasFinished = true;

//         safeDeleteFile(outputPath);

//         const cleanError = getCleanProcessError(stderr);
//         console.log("FFmpeg merge failed:", cleanError);

//         return sendJsonIfConnected(res, 500, {
//           status: "fail",
//           code: "FFMPEG_MERGE_FAILED",
//           error: "Download was not completed. Please try another quality.",
//           details: cleanError,
//         });
//       }

//       if (!fs.existsSync(outputPath)) {
//         isResponded = true;
//         hasFinished = true;

//         return sendJsonIfConnected(res, 500, {
//           status: "fail",
//           code: "PREPARED_FILE_NOT_FOUND",
//           error: "Prepared file not found.",
//         });
//       }

//       isResponded = true;
//       hasFinished = true;

//       return sendPreparedFile(res, outputPath, `${safeTitle}.${extension}`);
//     });
//   } catch (err) {
//     hasFinished = true;

//     if (clientCancelled || isClientDisconnected(res)) {
//       return;
//     }

//     console.log("Direct download error:", err.message);

//     return sendJsonIfConnected(res, 500, {
//       status: "fail",
//       code: "DIRECT_DOWNLOAD_FAILED",
//       error: "Download failed. Please try again.",
//     });
//   }
// };

// exports.proxyImage = async (req, res) => {
//   try {
//     const imageUrl = req.query.url;

//     if (!imageUrl) {
//       return res.status(400).json({
//         status: "fail",
//         code: "IMAGE_URL_REQUIRED",
//         error: "Image URL is required",
//       });
//     }

//     if (
//       typeof imageUrl !== "string" ||
//       (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))
//     ) {
//       return res.status(400).json({
//         status: "fail",
//         code: "INVALID_IMAGE_URL",
//         error: "Invalid image URL",
//       });
//     }

//     const response = await fetch(imageUrl);

//     if (!response.ok) {
//       return res.status(400).json({
//         status: "fail",
//         code: "IMAGE_FETCH_FAILED",
//         error: "Failed to fetch image",
//       });
//     }

//     const contentType = response.headers.get("content-type") || "image/jpeg";
//     res.setHeader("Content-Type", contentType);

//     const arrayBuffer = await response.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     return res.send(buffer);
//   } catch (err) {
//     console.log("Proxy image error:", err.message);

//     return res.status(500).json({
//       status: "fail",
//       code: "IMAGE_PROXY_FAILED",
//       error: "Image proxy failed",
//     });
//   }
// };


const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";

const COOKIE_CONTENT_BASE64 = process.env.COOKIE_CONTENT_BASE64 || "";
const COOKIES_PATH =
  process.env.COOKIES_PATH || path.join(__dirname, "..", "cookies.txt");

if (COOKIE_CONTENT_BASE64) {
  fs.writeFileSync(
    COOKIES_PATH,
    Buffer.from(COOKIE_CONTENT_BASE64, "base64").toString("utf8"),
    "utf8"
  );
}

const addCookiesArgs = (args = []) => {
  if (COOKIES_PATH && fs.existsSync(COOKIES_PATH)) {
    return ["--cookies", COOKIES_PATH, ...args];
  }

  return args;
};

console.log("Cookie base64 exists:", Boolean(process.env.COOKIE_CONTENT_BASE64));
console.log("Cookies file exists:", fs.existsSync(COOKIES_PATH));

exports.startApi = (req, res) => {
  res.status(200).json({ message: "Welcome To Vidown Api" });
};

const outputDir = path.join(__dirname, "..", "downloads");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sanitizeFileName = (value = "linkflow-download") => {
  const cleaned = String(value || "linkflow-download")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return cleaned || "linkflow-download";
};

const encodeRFC5987ValueChars = (value) => {
  return encodeURIComponent(value)
    .replace(/['()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/%(7C|60|5E)/g, (match) => match.toLowerCase());
};

const createContentDisposition = (filename) => {
  const fallbackName = sanitizeFileName(filename || "linkflow-download");
  const encodedName = encodeRFC5987ValueChars(filename || fallbackName);

  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
};

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp4") return "video/mp4";

  return "application/octet-stream";
};

const safeDeleteFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

const isClientDisconnected = (res) => {
  return res.destroyed || res.writableEnded || res.headersSent;
};

const sendJsonIfConnected = (res, statusCode, payload) => {
  if (res.destroyed || res.writableEnded || res.headersSent) {
    return;
  }

  return res.status(statusCode).json(payload);
};

const getCleanProcessError = (stderr = "") => {
  const text = String(stderr || "").trim();

  if (!text) return "Process stopped before completion.";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const importantLine =
    lines
      .reverse()
      .find((line) =>
        /error|failed|invalid|unable|not found|permission|denied/i.test(line)
      ) || lines[0];

  return importantLine || "Download process failed.";
};

const sendPreparedFile = (res, filePath, downloadName) => {
  if (!fs.existsSync(filePath)) {
    return sendJsonIfConnected(res, 500, {
      status: "fail",
      code: "PREPARED_FILE_NOT_FOUND",
      error: "Prepared file not found.",
    });
  }

  const stat = fs.statSync(filePath);
  const finalName = downloadName || path.basename(filePath);

  res.setHeader("Content-Type", getContentType(filePath));
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", createContentDisposition(finalName));

  const stream = fs.createReadStream(filePath);

  stream.pipe(res);

  stream.on("close", () => {
    setTimeout(() => {
      safeDeleteFile(filePath);
    }, 60 * 1000);
  });

  stream.on("error", (err) => {
    console.log("File stream error:", err.message);

    if (!res.headersSent) {
      sendJsonIfConnected(res, 500, {
        status: "fail",
        code: "FILE_STREAM_FAILED",
        error: "Failed to stream file.",
      });
    }
  });
};

const normalizeMediaUrl = (url = "") => {
  return String(url || "")
    .trim()
    .replace("https://x.com/", "https://twitter.com/")
    .replace("http://x.com/", "https://twitter.com/")
    .replace("https://www.x.com/", "https://twitter.com/")
    .replace("http://www.x.com/", "https://twitter.com/");
};

const isHlsFormat = (item = {}) => {
  const protocol = String(item.protocol || "").toLowerCase();
  const url = String(item.url || "").toLowerCase();

  return protocol.includes("m3u8") || url.includes(".m3u8");
};

const isDirectPlayableFormat = (item = {}) => {
  const ext = String(item.ext || "").toLowerCase();

  return item.url && !isHlsFormat(item) && ["mp4", "webm"].includes(ext);
};

const getActualDuration = (data = {}, item = {}) => {
  return Number(item.duration || data.duration || 0) || null;
};

const isMetricOnlyTitle = (value = "") => {
  const text = String(value).trim().toLowerCase();

  if (!text) return true;

  return (
    /^\d+(\.\d+)?[kmb]?\s+(views|reactions|shares|comments)/i.test(text) ||
    text.includes("reactions") ||
    text.includes("shares") ||
    text === "follow" ||
    text === "like" ||
    text.length < 3
  );
};

const getCleanTitle = (data = {}) => {
  const rawTitle = data.title || data.fulltitle || "";
  const description = data.description || "";
  const uploader = data.uploader || "";

  const lines = description
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let title =
    lines.find((line) => !isMetricOnlyTitle(line)) ||
    rawTitle ||
    uploader ||
    "Video";

  title = title
    .replace(/\s+/g, " ")
    .replace(
      /^\d+(\.\d+)?[KMB]?\s+views\s*·\s*\d+(\.\d+)?[KMB]?\s+reactions\s*\|\s*/i,
      ""
    )
    .replace(/^\d+(\.\d+)?[KMB]?\s+views\s*\|\s*/i, "")
    .replace(
      /^\d+(\.\d+)?[KMB]?\s+reactions\s*·\s*\d+(\.\d+)?[KMB]?\s+shares/i,
      ""
    )
    .split("Download the app")[0]
    .split("LINK IN BIO")[0]
    .split("Cast:")[0]
    .split("#")[0]
    .trim();

  if (title.toLowerCase().includes(" is now streaming")) {
    title = title.split(/ is now streaming/i)[0].trim();
  }

  if (isMetricOnlyTitle(title)) {
    title = uploader || "Video";
  }

  return title.slice(0, 70) || "Video";
};

const formatDuration = (seconds) => {
  if (
    seconds === null ||
    seconds === undefined ||
    Number.isNaN(Number(seconds))
  ) {
    return null;
  }

  const totalSeconds = Math.floor(Number(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatSize = (bytes, estimated = false) => {
  const size = Number(bytes);

  if (!size || Number.isNaN(size) || size <= 0) {
    return estimated ? "Approx. 1 MB" : "1 MB";
  }

  const kb = size / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  let label = "";

  if (gb >= 1) {
    label = `${gb.toFixed(1)} GB`;
  } else if (mb >= 100) {
    label = `${Math.round(mb)} MB`;
  } else if (mb >= 10) {
    label = `${mb.toFixed(1)} MB`;
  } else if (mb >= 1) {
    label = `${mb.toFixed(1)} MB`;
  } else {
    label = `${Math.max(1, Math.round(kb))} KB`;
  }

  return estimated ? `Approx. ${label}` : label;
};

const getDirectSizeBytes = (item = {}) => {
  const candidates = [
    item.filesize,
    item.filesize_approx,
    item.size,
    item.file_size,
    item.content_length,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);

    if (value && !Number.isNaN(value) && value > 0) {
      return value;
    }
  }

  return null;
};

const estimateSizeFromBitrate = (item = {}, durationSeconds) => {
  const duration = Number(durationSeconds || item.duration || 0);

  if (!duration || Number.isNaN(duration) || duration <= 0) {
    return null;
  }

  const bitrateKbps =
    Number(item.tbr || 0) ||
    Number(item.vbr || 0) ||
    Number(item.abr || 0) ||
    Number(item.bitrate || 0);

  if (!bitrateKbps || Number.isNaN(bitrateKbps) || bitrateKbps <= 0) {
    return null;
  }

  return (bitrateKbps * 1000 * duration) / 8;
};

const getEstimatedVideoBitrateKbps = (item = {}) => {
  const height = Number(item.height || 0);

  if (height >= 4320) return 35000;
  if (height >= 2160) return 16000;
  if (height >= 1440) return 9000;
  if (height >= 1080) return 5200;
  if (height >= 720) return 2800;
  if (height >= 480) return 1300;
  if (height >= 360) return 800;
  if (height >= 240) return 450;

  if (item.width && item.height) return 800;

  return 600;
};

const estimateVideoSizeFromResolution = (item = {}, durationSeconds) => {
  const duration = Number(durationSeconds || item.duration || 0);

  if (!duration || Number.isNaN(duration) || duration <= 0) {
    return null;
  }

  let bitrateKbps = getEstimatedVideoBitrateKbps(item);

  if (String(item.ext || "").toLowerCase() === "webm") {
    bitrateKbps *= 0.85;
  }

  if (isHlsFormat(item)) {
    bitrateKbps *= 0.9;
  }

  return (bitrateKbps * 1000 * duration) / 8;
};

const estimateAudioSize = (item = {}, durationSeconds) => {
  const duration = Number(durationSeconds || item.duration || 0);

  if (!duration || Number.isNaN(duration) || duration <= 0) {
    return null;
  }

  const bitrateKbps =
    Number(item.abr || 0) ||
    Number(item.tbr || 0) ||
    Number(item.asr ? 128 : 0) ||
    128;

  return (bitrateKbps * 1000 * duration) / 8;
};

const getFallbackSizeBytes = (type = "video", durationSeconds) => {
  const duration = Number(durationSeconds || 0);

  if (duration && !Number.isNaN(duration) && duration > 0) {
    if (type === "audio") {
      return (128 * 1000 * duration) / 8;
    }

    return (900 * 1000 * duration) / 8;
  }

  if (type === "audio") {
    return 512 * 1024;
  }

  return 2 * 1024 * 1024;
};

const getFormatSizeInfo = (item = {}, durationSeconds, type = "video") => {
  const exactBytes = getDirectSizeBytes(item);

  if (exactBytes) {
    return {
      size: formatSize(exactBytes, false),
      sizeBytes: Math.round(exactBytes),
      sizeEstimated: false,
    };
  }

  const bitrateEstimate = estimateSizeFromBitrate(item, durationSeconds);

  if (bitrateEstimate) {
    return {
      size: formatSize(bitrateEstimate, true),
      sizeBytes: Math.round(bitrateEstimate),
      sizeEstimated: true,
    };
  }

  const smartEstimate =
    type === "audio"
      ? estimateAudioSize(item, durationSeconds)
      : estimateVideoSizeFromResolution(item, durationSeconds);

  if (smartEstimate) {
    return {
      size: formatSize(smartEstimate, true),
      sizeBytes: Math.round(smartEstimate),
      sizeEstimated: true,
    };
  }

  const fallbackSize = getFallbackSizeBytes(type, durationSeconds);

  return {
    size: formatSize(fallbackSize, true),
    sizeBytes: Math.round(fallbackSize),
    sizeEstimated: true,
  };
};

const getFormatDisplaySize = (item = {}, data = {}, type = "video") => {
  const duration = getActualDuration(data, item);
  return getFormatSizeInfo(item, duration, type);
};

const getAspectRatio = (width, height, ytAspectRatio) => {
  if (ytAspectRatio && Number(ytAspectRatio) < 0.8) return "portrait";
  if (ytAspectRatio && Number(ytAspectRatio) > 1.2) return "landscape";

  if (
    ytAspectRatio &&
    Number(ytAspectRatio) >= 0.8 &&
    Number(ytAspectRatio) <= 1.2
  ) {
    return "square";
  }

  if (!width || !height) return "landscape";
  if (height > width) return "portrait";
  if (width === height) return "square";

  return "landscape";
};

const getQualityLabel = (item = {}) => {
  const height = Number(item.height || 0);

  if (height >= 4320) return "4320p (8K)";
  if (height >= 2160) return "2160p (4K)";
  if (height >= 1440) return "1440p (2K)";
  if (height >= 1080) return "1080p (Full HD)";
  if (height >= 720) return "720p (HD)";
  if (height >= 480) return "480p (SD)";
  if (height >= 360) return "360p";
  if (height >= 240) return "240p";

  if (item.width && item.height) {
    return `${item.width}×${item.height}`;
  }

  return item.format_note || item.resolution || item.format_id || "Default";
};

const getSortHeight = (quality = "") => {
  if (quality.includes("4320")) return 4320;
  if (quality.includes("2160")) return 2160;
  if (quality.includes("1440")) return 1440;
  if (quality.includes("1080")) return 1080;
  if (quality.includes("720")) return 720;
  if (quality.includes("480")) return 480;
  if (quality.includes("360")) return 360;
  if (quality.includes("240")) return 240;

  return Number(String(quality).match(/\d+/)?.[0]) || 0;
};

const normalizeErrorMessage = (stderr = "") => {
  const lowerError = stderr.toLowerCase();

  const isFacebookError =
    lowerError.includes("[facebook]") ||
    lowerError.includes("facebook") ||
    lowerError.includes("cannot parse data");

  const isCookieError =
    lowerError.includes("cookies") ||
    lowerError.includes("login") ||
    lowerError.includes("private") ||
    lowerError.includes("not available") ||
    lowerError.includes("sign in");

  const isUnsupportedError =
    lowerError.includes("unsupported url") ||
    lowerError.includes("no suitable extractor");

  const isTwitterError =
    lowerError.includes("[twitter]") ||
    lowerError.includes("x.com") ||
    lowerError.includes("twitter.com");

  if (isFacebookError) {
    return {
      statusCode: 422,
      code: "FACEBOOK_EXTRACT_FAILED",
      error:
        "Facebook could not fully process this link. Try another public reel/video URL.",
    };
  }

  if (isTwitterError && isCookieError) {
    return {
      statusCode: 401,
      code: "X_LOGIN_OR_COOKIES_REQUIRED",
      error:
        "This X/Twitter video may require login. Please try a public post link.",
    };
  }

  if (isCookieError) {
    return {
      statusCode: 401,
      code: "LOGIN_OR_COOKIES_REQUIRED",
      error:
        "This video may require login or cookies. Please try a public video link.",
    };
  }

  if (isUnsupportedError) {
    return {
      statusCode: 400,
      code: "UNSUPPORTED_URL",
      error:
        "This website or link format is not supported. Please try another valid video URL.",
    };
  }

  return {
    statusCode: 500,
    code: "MEDIA_EXTRACT_FAILED",
    error:
      "Unable to extract this media. Please check the link or try another video.",
  };
};

exports.postMedia = async (req, res, next) => {
  try {
    const url = normalizeMediaUrl(req.body.urls);

    if (
      !url ||
      typeof url !== "string" ||
      (!url.startsWith("http://") && !url.startsWith("https://"))
    ) {
      return res.status(400).json({
        status: "fail",
        code: "INVALID_URL",
        error: "Valid URL is required",
      });
    }

    const ytDlp = spawn(
      YTDLP_PATH,
      addCookiesArgs([
        "-J",
        "--no-playlist",
        "--no-warnings",
        "--socket-timeout",
        "20",
        url,
      ]),
      {
        timeout: 45000,
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";
    let isResponded = false;

    ytDlp.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ytDlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ytDlp.on("error", (err) => {
      if (isResponded) return;
      isResponded = true;

      console.log("yt-dlp process error:", err.message);

      return res.status(500).json({
        status: "fail",
        code: "YTDLP_NOT_FOUND",
        error:
          "yt-dlp is not installed or failed to start. Please install or update yt-dlp on the server.",
      });
    });

    ytDlp.on("close", async (code) => {
      if (isResponded) return;

      let data = null;

      if (stdout) {
        try {
          data = JSON.parse(stdout);
        } catch {
          data = null;
        }
      }

      if (code !== 0 && !data) {
        isResponded = true;

        const friendlyError = normalizeErrorMessage(stderr);

        return res.status(friendlyError.statusCode).json({
          status: "fail",
          code: friendlyError.code,
          error: friendlyError.error,
          details: stderr || "Unknown yt-dlp error",
        });
      }

      if (!data) {
        isResponded = true;

        return res.status(500).json({
          status: "fail",
          code: "INVALID_YTDLP_RESPONSE",
          error: "Invalid yt-dlp response. Please try another video link.",
        });
      }

      const allFormats = Array.isArray(data.formats) ? data.formats : [];

      const audioFormats = allFormats
        .filter((item) => {
          return (
            item.url &&
            item.acodec &&
            item.acodec !== "none" &&
            (!item.vcodec || item.vcodec === "none")
          );
        })
        .map((item) => {
          const sizeInfo = getFormatDisplaySize(item, data, "audio");

          return {
            type: "audio",
            url: item.url,
            quality:
              item.abr || item.asr
                ? `${Math.round(item.abr || item.asr)} kbps`
                : item.format_note || "Audio",
            ext: item.ext || "m4a",
            size: sizeInfo.size,
            sizeBytes: sizeInfo.sizeBytes,
            sizeEstimated: sizeInfo.sizeEstimated,
            formatId: item.format_id || "",
            width: null,
            height: null,
            fps: null,
            vcodec: item.vcodec || "",
            acodec: item.acodec || "",
            hasAudio: true,
            audioUrl: "",
            audioFormatId: item.format_id || "",
            aspectRatio: "audio",
            protocol: item.protocol || "",
            isHls: isHlsFormat(item),
            previewPlayable: false,
          };
        })
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (x) => x.quality === item.quality && x.ext === item.ext
            )
        )
        .slice(0, 8);

      const progressiveAudioFallback = allFormats
        .filter((item) => {
          return (
            item.url &&
            item.vcodec &&
            item.vcodec !== "none" &&
            item.acodec &&
            item.acodec !== "none"
          );
        })
        .sort((a, b) => {
          const aDirect = isDirectPlayableFormat(a) ? 1 : 0;
          const bDirect = isDirectPlayableFormat(b) ? 1 : 0;

          if (aDirect !== bDirect) return bDirect - aDirect;

          return Number(b.height || 0) - Number(a.height || 0);
        })[0];

      if (!audioFormats.length && progressiveAudioFallback) {
        const sizeInfo = getFormatDisplaySize(
          progressiveAudioFallback,
          data,
          "audio"
        );

        audioFormats.push({
          type: "audio",
          url: progressiveAudioFallback.url,
          quality: progressiveAudioFallback.abr
            ? `${Math.round(progressiveAudioFallback.abr)} kbps`
            : "Extract audio",
          ext: "mp3",
          size: sizeInfo.size,
          sizeBytes: sizeInfo.sizeBytes,
          sizeEstimated: true,
          formatId: progressiveAudioFallback.format_id || "",
          width: null,
          height: null,
          fps: null,
          vcodec: progressiveAudioFallback.vcodec || "",
          acodec: progressiveAudioFallback.acodec || "",
          hasAudio: true,
          audioUrl: "",
          audioFormatId: progressiveAudioFallback.format_id || "",
          aspectRatio: "audio",
          protocol: progressiveAudioFallback.protocol || "",
          isHls: isHlsFormat(progressiveAudioFallback),
          previewPlayable: false,
        });
      }

      const bestAudio =
        audioFormats.find((item) => item.ext === "m4a") ||
        audioFormats[0] ||
        null;

      const progressiveVideoFormats = allFormats
        .filter((item) => {
          return (
            item.url &&
            item.vcodec &&
            item.vcodec !== "none" &&
            item.acodec &&
            item.acodec !== "none"
          );
        })
        .map((item) => {
          const sizeInfo = getFormatDisplaySize(item, data, "video");

          return {
            type: "video",
            url: item.url,
            quality: getQualityLabel(item),
            ext: item.ext || "mp4",
            size: sizeInfo.size,
            sizeBytes: sizeInfo.sizeBytes,
            sizeEstimated: sizeInfo.sizeEstimated,
            formatId: item.format_id || "",
            width: item.width || null,
            height: item.height || null,
            fps: item.fps || null,
            vcodec: item.vcodec || "",
            acodec: item.acodec || "",
            hasAudio: true,
            audioUrl: "",
            audioFormatId: "",
            aspectRatio: getAspectRatio(
              item.width,
              item.height,
              item.aspect_ratio
            ),
            protocol: item.protocol || "",
            isHls: isHlsFormat(item),
            previewPlayable: isDirectPlayableFormat(item),
          };
        });

      const dashVideoFormats = allFormats
        .filter((item) => {
          return (
            item.url &&
            item.vcodec &&
            item.vcodec !== "none" &&
            (!item.acodec || item.acodec === "none")
          );
        })
        .map((item) => {
          const sizeInfo = getFormatDisplaySize(item, data, "video");

          return {
            type: "video",
            url: item.url,
            quality: getQualityLabel(item),
            ext: item.ext || "mp4",
            size: sizeInfo.size,
            sizeBytes: sizeInfo.sizeBytes,
            sizeEstimated: sizeInfo.sizeEstimated,
            formatId: item.format_id || "",
            width: item.width || null,
            height: item.height || null,
            fps: item.fps || null,
            vcodec: item.vcodec || "",
            acodec: item.acodec || "none",
            hasAudio: false,
            audioUrl: bestAudio?.url || "",
            audioFormatId: bestAudio?.formatId || "",
            aspectRatio: getAspectRatio(
              item.width,
              item.height,
              item.aspect_ratio
            ),
            protocol: item.protocol || "",
            isHls: isHlsFormat(item),
            previewPlayable: isDirectPlayableFormat(item),
          };
        });

      const videoFormats = [...progressiveVideoFormats, ...dashVideoFormats]
        .filter((item) => item.url)
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (x) =>
                x.quality === item.quality &&
                x.ext === item.ext &&
                x.aspectRatio === item.aspectRatio &&
                x.hasAudio === item.hasAudio
            )
        )
        .sort((a, b) => {
          if (a.previewPlayable && !b.previewPlayable) return -1;
          if (!a.previewPlayable && b.previewPlayable) return 1;

          if (a.ext === "mp4" && b.ext !== "mp4") return -1;
          if (a.ext !== "mp4" && b.ext === "mp4") return 1;

          if (a.hasAudio && !b.hasAudio) return -1;
          if (!a.hasAudio && b.hasAudio) return 1;

          const byHeight = getSortHeight(b.quality) - getSortHeight(a.quality);

          if (byHeight !== 0) return byHeight;

          return Number(b.sizeBytes || 0) - Number(a.sizeBytes || 0);
        })
        .slice(0, 12);

      const bestPreview =
        videoFormats.find((item) => item.previewPlayable && item.hasAudio) ||
        videoFormats.find((item) => item.previewPlayable) ||
        null;

      isResponded = true;

      res.status(200).json({
        status: "success",
        platform: data.extractor_key || data.extractor || "unknown",
        title: getCleanTitle(data),
        originalTitle: data.title || data.fulltitle || "Media",
        uploader: data.uploader || "",
        thumb: data.thumbnail || "",
        duration: data.duration || null,
        durationText:
          formatDuration(data.duration) || data.duration_string || "--",
        viewCount: data.view_count || null,
        webpage_url: data.webpage_url || url,
        aspectRatio: bestPreview?.aspectRatio || "landscape",
        previewUrl: bestPreview?.url || "",
        previewAudioUrl:
          bestPreview && !bestPreview.hasAudio ? bestPreview.audioUrl : "",
        previewHasAudio: Boolean(bestPreview?.hasAudio),
        previewPlayable: Boolean(bestPreview?.previewPlayable),
        video: videoFormats,
        audio: audioFormats,
        urls: [...videoFormats, ...audioFormats],
      });

      if (req.users) {
        req.users.addActivity({ mediaUrl: url }).catch((err) => {
          console.log("Activity save error:", err.message);
        });
      }
    });
  } catch (err) {
    console.log("Media API error:", err.message);

    if (!res.headersSent) {
      res.status(500).json({
        status: "fail",
        code: "SERVER_ERROR",
        error: "Download failed. Please try again.",
      });
    }

    next(err);
  }
};

exports.downloadDirectMedia = async (req, res) => {
  let childProcess = null;
  let hasFinished = false;
  let clientCancelled = false;
  let outputPathToClean = "";

  const cleanupProcess = () => {
    clientCancelled = true;

    if (childProcess && !childProcess.killed) {
      try {
        childProcess.kill("SIGKILL");
      } catch {}
    }

    if (outputPathToClean) {
      safeDeleteFile(outputPathToClean);
    }
  };

  req.on("aborted", cleanupProcess);

  res.on("close", () => {
    if (!hasFinished) {
      cleanupProcess();
    }
  });

  try {
    const {
      type,
      title,
      originalUrl,
      platform,
      videoUrl,
      audioUrl,
      videoFormatId,
      audioFormatId,
      hasAudio,
    } = req.body;

    const safeTitle = sanitizeFileName(title || "linkflow-download");
    const timestamp = Date.now();
    const extension = type === "audio" ? "mp3" : "mp4";

    const outputPath = path.join(
      outputDir,
      `${safeTitle}-${timestamp}.${extension}`
    );

    outputPathToClean = outputPath;

    const platformName = String(platform || "").toLowerCase();
    const originalUrlValue = normalizeMediaUrl(originalUrl || "");

    const shouldUseYtDlp =
      originalUrlValue &&
      (platformName.includes("youtube") ||
        originalUrlValue.includes("youtube.com") ||
        originalUrlValue.includes("youtu.be"));

    if (shouldUseYtDlp) {
      const outputTemplate = path.join(
        outputDir,
        `${safeTitle}-${timestamp}.%(ext)s`
      );

      const selectedHasAudio = hasAudio === true || hasAudio === "true";

      const args = addCookiesArgs([
        "--no-playlist",
        "--newline",
        "--force-overwrites",
        "--no-warnings",
        "-N",
        "4",
      ]);

      if (type === "audio") {
        args.push(
          "-f",
          audioFormatId || "bestaudio",
          "-x",
          "--audio-format",
          "mp3",
          "-o",
          outputTemplate,
          originalUrlValue
        );
      } else {
        let formatSpec = "bestvideo+bestaudio/best";

        if (videoFormatId && selectedHasAudio) {
          formatSpec = `${videoFormatId}/best`;
        } else if (videoFormatId && audioFormatId) {
          formatSpec = `${videoFormatId}+${audioFormatId}/${videoFormatId}+bestaudio/best`;
        } else if (videoFormatId) {
          formatSpec = `${videoFormatId}+bestaudio/bestvideo+bestaudio/best`;
        }

        args.push(
          "-f",
          formatSpec,
          "--merge-output-format",
          "mp4",
          "-o",
          outputTemplate,
          originalUrlValue
        );
      }

      childProcess = spawn(YTDLP_PATH, args, {
        timeout: 600000,
        windowsHide: true,
      });

      let stderr = "";
      let isResponded = false;

      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("error", (err) => {
        if (isResponded || clientCancelled || isClientDisconnected(res)) return;

        isResponded = true;
        hasFinished = true;

        console.log("yt-dlp start error:", err.message);

        return sendJsonIfConnected(res, 500, {
          status: "fail",
          code: "YTDLP_DOWNLOAD_START_FAILED",
          error: "Download engine failed to start.",
          details: err.message,
        });
      });

      childProcess.on("close", (code, signal) => {
        if (isResponded) return;

        if (
          clientCancelled ||
          signal === "SIGKILL" ||
          isClientDisconnected(res)
        ) {
          hasFinished = true;
          safeDeleteFile(outputPathToClean);
          return;
        }

        if (code !== 0) {
          isResponded = true;
          hasFinished = true;

          const cleanError = getCleanProcessError(stderr);
          console.log("yt-dlp download failed:", cleanError);

          return sendJsonIfConnected(res, 500, {
            status: "fail",
            code: "YTDLP_DOWNLOAD_FAILED",
            error: "Download was not completed. Please try again.",
            details: cleanError,
          });
        }

        const files = fs
          .readdirSync(outputDir)
          .filter((file) => file.startsWith(`${safeTitle}-${timestamp}`));

        if (!files.length) {
          isResponded = true;
          hasFinished = true;

          return sendJsonIfConnected(res, 500, {
            status: "fail",
            code: "DOWNLOADED_FILE_NOT_FOUND",
            error: "Prepared file not found.",
          });
        }

        const filePath = path.join(outputDir, files[0]);
        const finalName = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;

        outputPathToClean = filePath;
        isResponded = true;
        hasFinished = true;

        return sendPreparedFile(res, filePath, finalName);
      });

      return;
    }

    if (type === "video" && !videoUrl) {
      hasFinished = true;

      return sendJsonIfConnected(res, 400, {
        status: "fail",
        code: "VIDEO_URL_REQUIRED",
        error: "Video URL is required.",
      });
    }

    if (type === "audio" && !audioUrl && !videoUrl) {
      hasFinished = true;

      return sendJsonIfConnected(res, 400, {
        status: "fail",
        code: "AUDIO_URL_REQUIRED",
        error: "Audio URL is required.",
      });
    }

    const args = ["-hide_banner", "-loglevel", "error", "-nostdin"];

    if (type === "audio") {
      args.push(
        "-y",
        "-i",
        audioUrl || videoUrl,
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outputPath
      );
    } else if (audioUrl) {
      args.push(
        "-y",
        "-i",
        videoUrl,
        "-i",
        audioUrl,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        "-shortest",
        outputPath
      );
    } else {
      args.push(
        "-y",
        "-i",
        videoUrl,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        outputPath
      );
    }

    childProcess = spawn(FFMPEG_PATH, args, {
      timeout: 600000,
      windowsHide: true,
    });

    let stderr = "";
    let isResponded = false;

    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    childProcess.on("error", (err) => {
      if (isResponded || clientCancelled || isClientDisconnected(res)) return;

      isResponded = true;
      hasFinished = true;

      console.log("FFmpeg start error:", err.message);

      return sendJsonIfConnected(res, 500, {
        status: "fail",
        code: "FFMPEG_START_FAILED",
        error:
          "Download engine failed to start. Please check FFmpeg installation.",
        details: err.message,
      });
    });

    childProcess.on("close", (code, signal) => {
      if (isResponded) return;

      if (clientCancelled || signal === "SIGKILL" || isClientDisconnected(res)) {
        hasFinished = true;
        safeDeleteFile(outputPath);
        return;
      }

      if (code !== 0) {
        isResponded = true;
        hasFinished = true;

        safeDeleteFile(outputPath);

        const cleanError = getCleanProcessError(stderr);
        console.log("FFmpeg merge failed:", cleanError);

        return sendJsonIfConnected(res, 500, {
          status: "fail",
          code: "FFMPEG_MERGE_FAILED",
          error: "Download was not completed. Please try another quality.",
          details: cleanError,
        });
      }

      if (!fs.existsSync(outputPath)) {
        isResponded = true;
        hasFinished = true;

        return sendJsonIfConnected(res, 500, {
          status: "fail",
          code: "PREPARED_FILE_NOT_FOUND",
          error: "Prepared file not found.",
        });
      }

      isResponded = true;
      hasFinished = true;

      return sendPreparedFile(res, outputPath, `${safeTitle}.${extension}`);
    });
  } catch (err) {
    hasFinished = true;

    if (clientCancelled || isClientDisconnected(res)) {
      return;
    }

    console.log("Direct download error:", err.message);

    return sendJsonIfConnected(res, 500, {
      status: "fail",
      code: "DIRECT_DOWNLOAD_FAILED",
      error: "Download failed. Please try again.",
    });
  }
};

exports.proxyImage = async (req, res) => {
  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).json({
        status: "fail",
        code: "IMAGE_URL_REQUIRED",
        error: "Image URL is required",
      });
    }

    if (
      typeof imageUrl !== "string" ||
      (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))
    ) {
      return res.status(400).json({
        status: "fail",
        code: "INVALID_IMAGE_URL",
        error: "Invalid image URL",
      });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(400).json({
        status: "fail",
        code: "IMAGE_FETCH_FAILED",
        error: "Failed to fetch image",
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.send(buffer);
  } catch (err) {
    console.log("Proxy image error:", err.message);

    return res.status(500).json({
      status: "fail",
      code: "IMAGE_PROXY_FAILED",
      error: "Image proxy failed",
    });
  }
};