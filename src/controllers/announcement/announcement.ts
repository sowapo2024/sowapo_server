

const Announcements = require('../../models/announcement'); // Replace 'yourAnnouncementModel' with the actual file path of your model

// Create Announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, callToAction, external_link, body} = req.body;
    const banner = req.file?.path
    const newAnnouncement = new Announcements({
      title,
      author:req?.admin._id,
      callToAction,
      external_link,
      body,
      banner
    });
    const savedAnnouncement = await newAnnouncement.save();

    res.status(201).json({ data: savedAnnouncement, message: 'Announcement created successfully' });
  } catch (error) {
    console.error('Error in createAnnouncement:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read All Announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcements.find();
    res.status(200).json({ data: announcements, message: 'Fetched all announcements successfully' });
  } catch (error) {
    console.error('Error in getAllAnnouncements:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read Single Announcement
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcements.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ data: announcement, message: 'Fetched announcement successfully' });
  } catch (error) {
    console.error('Error in getAnnouncementById:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Update Announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const updatedAnnouncement = await Announcements.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ data: updatedAnnouncement, message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error in updateAnnouncement:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Delete Announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const deletedAnnouncement = await Announcements.findByIdAndDelete(req.params.id);
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ data: deletedAnnouncement, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};
