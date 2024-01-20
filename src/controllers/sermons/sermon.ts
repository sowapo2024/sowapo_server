const Sermon = require('../../models/sermon');
const mongoose = require('mongoose');
const { Types } = mongoose;

interface Request_body {
  title: string;
  author: string;
  description: string;
  audience: string;
}

interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}
// create Sermon
exports.createSermon = async (req, res) => {
  try {
    const { title, author, description, audience }: Request_body = req.body;
    console.log(req.files[0]);
    const mediaUrls: Media[] = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
    }));

    const newSermon = new Sermon({
      title,
      author,
      description,
      mediaUrls,
      audience,
    });
    const savedSermon = await newSermon.save();

    res.status(201).json(savedSermon);
  } catch (error) {
    console.error('Error creating Sermon:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

exports.getAllSermons = async (req, res) => {
  try {
    const sermons = await Sermon.find().populate('author', 'username'); // Assuming 'username' is a field in the Admin model
    res.status(200).json({data:sermons,message:"sermons retrieved"});
  } catch (error) {
    console.error('Error getting sermons:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//   get a single Sermon
exports.getSermonById = async (req, res) => {
  const { sermonId } = req.params;

  try {
    const sermon = await Sermon.findById(sermonId).populate('author', 'username');

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.status(200).json({data:sermon,message:"sermon retrieved"});
  } catch (error) {
    console.error('Error getting Sermon by Id:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// filter sermons

exports.filterSermons = async (req, res) => {
  try {
    let { sort, ...query } = req.query;

    // Sorting Result

    let sortList: [] | {};
    if (sort) {
      sortList = sort.split(',').map((s) => {
        const [field, order] = s.split(':');
        console.log(field, order);
        return [field, order === 'desc' ? -1 : 1];
      });
    } else {
      sortList = { createdAt: -1 };
    }
    const sermons = await Sermon.find(query).sort(sortList).populate('author');
    if (sermons.length <= 0) {
      return res
        .status(400)
        .json({ data: sermons, message: 'No item match your search' });
    }
    return res
      .status(200)
      .json({ data: sermons, message: 'fetched sermons sucesfully' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: error, message: 'something went wrong' });
  }
};

// update Sermon
exports.updateSermonById = async (req, res) => {
  const { sermonId } = req.params;
  const { title, author, description ,audience} = req.body;

  try {
    // Check if sermonId is a valid ObjectId
    if (!Types.ObjectId.isValid(sermonId)) {
      return res.status(400).json({ error: 'Invalid Sermon ID' });
    }

    const sermon = await Sermon.findById(sermonId);

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    console.log(req.filePaths, 'files');
    const mediaUrls: Media[] = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
    }));

    console.log(mediaUrls, "media urls")
    // Remove or update existing media URLs based on your requirements
    const existingMediaUrls = sermon.mediaUrls.filter(
      (existingMedia) =>
        !mediaUrls.some((newMedia) => newMedia.id === existingMedia.id),
    );

    const updatedSermon = await Sermon.findByIdAndUpdate(
      sermonId,
      {
        $set: {
          title: title || sermon.title,
          author: author || sermon.author,
          audience:audience||sermon?.audience,
          description: description || sermon.description,
          mediaUrls: [...existingMediaUrls, ...mediaUrls],
        },
      },
      { new: true },
    ).populate('author', 'username');

    if (!updatedSermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.status(200).json({data:updatedSermon,message:"sermon updated"});
  } catch (error) {
    console.error('Error updating Sermon by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// delete Sermon by id
exports.deleteSermonById = async (req, res) => {
  const { sermonId } = req.params;

  try {
    const deletedSermon = await Sermon.findByIdAndDelete(sermonId);

    if (!deletedSermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.status(200).json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    console.error('Error deleting Sermon by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteImageFromSermon = async (req, res) => {
  const { sermonId, imageId }: { sermonId: string; imageId: string } = req.params;

  try {
    const sermon = await Sermon.findByIdAndUpdate(sermonId, {
      mediaUrls: {
        $pull: {
          _id: imageId,
        },
      },
    });

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // const updatedImages = Sermon.mediaUrls.filter((image) => image.id !== imageId);

    // Sermon.mediaUrls = updatedImages;
    // const updatedSermon = await Sermon.save();

    res.status(200).json({ data: sermon, message: 'Media has been deleted ' });
  } catch (error) {
    console.error('Error deleting image from Sermon:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

module.exports;
