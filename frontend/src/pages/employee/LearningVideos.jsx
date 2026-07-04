import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Skeleton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { learningVideoApi } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/helpers";

function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function LearningVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    let mounted = true;

    async function fetchVideos() {
      try {
        const res = await learningVideoApi.list({ limit: 100 });
        const data = res.data?.data || [];
        // Backend already filters: shows videos assigned to this employee
        // OR videos assigned to all employees (empty assignedTo array)
        if (mounted) setVideos(Array.isArray(data) ? data : []);
      } catch {
        // Leave empty on error
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchVideos();
    return () => {
      mounted = false;
    };
  }, [user?._id]);

  if (loading) {
    return (
      <Box>
        <Typography
          variant="h4"
          fontWeight={700}
          mb={3}
          fontSize={{ xs: "1.5rem", sm: "2.125rem" }}
        >
          My Learning Videos
        </Typography>
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton
                  variant="rectangular"
                  height={isMobile ? 180 : 200}
                  sx={{ borderRadius: 0 }}
                />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={28} />
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="60%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
        fontSize={{ xs: "1.5rem", sm: "2.125rem" }}
      >
        My Learning Videos
      </Typography>

      {videos.length === 0 ? (
        <Box py={6} textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Learning Videos Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any learning videos assigned yet. Check back later.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {videos.map((video) => {
            const videoId = extractYoutubeId(video.url || video.videoUrl);
            return (
              <Grid item xs={12} sm={6} md={4} key={video._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[8],
                    },
                  }}
                >
                  {/* Embedded YouTube Player */}
                  {videoId ? (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "56.25%",
                        bgcolor: "#000",
                      }}
                    >
                      <iframe
                        title={video.title}
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        paddingTop: "56.25%",
                        bgcolor: "grey.900",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                      >
                        Invalid URL
                      </Typography>
                    </Box>
                  )}

                  <CardContent
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      px: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      noWrap
                      fontSize={{ xs: "0.95rem", sm: "1rem" }}
                    >
                      {video.title}
                    </Typography>
                    {video.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        {video.description}
                      </Typography>
                    )}
                    <Box display="flex" alignItems="center" gap={1} mt="auto">
                      <Chip
                        label={formatDate(video.createdAt || video.dateAdded)}
                        size="small"
                        variant="outlined"
                        sx={{ height: { xs: 20, sm: 22 }, "& .MuiChip-label": { fontSize: { xs: 10, sm: 11 } } }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
