const axios = require("axios")

const apiKey = 'YOUR_API_KEY';
const channelId = 'CHANNEL_ID';
exports.fetchLiveStreams = async (req, res) => {
    try {
      // Fetch the channel's livestreams using YouTube Data API
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
      );
  
      // Filter only the livestreams that are currently live
      const liveStreams = response.data.items.filter(
        (item) => item.snippet.liveBroadcastContent === 'live'
      );
  
      // Extract relevant information (you can customize this based on your needs)
      const liveStreamData = liveStreams.map((item) => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
      }));
  
      res.json({data:liveStreamData,message:"Fetched streams successfully"});
    } catch (error) {
      console.error('Error fetching livestreams:', error.message);
      res.status(500).json({ error: error,message:"internal server error" });
    }
  }