const axios = require("axios")
require("dotenv").config()

const  channelId= process.env.YOUTUBE_CHANNEL_ID;
const apiKey = process.env.YOUTUBE_API_KEY;
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
      console.log(error)
      res.status(500).json({ error: error,message:"internal server error" });
    }
  }