const Post = require('../../models/post');
const mongoose = require('mongoose');
const { Types } = mongoose;
const {
  sendPushNotification,
} = require('../../external-apis/fcm_push_notification');

const {
  sendGeneralPushNotification,
} = require('../../external-apis/push-notification');

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
// create post
exports.createPost = async (req, res) => {
  try {
    const { title, author, description, audience }: Request_body = req.body;
    console.log(req.files[0]);
    const mediaUrls: Media[] = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
      file_extension: file.mimetype.split('/')[1],
    }));

    const newPost = new Post({
      title,
      author,
      description,
      mediaUrls,
      audience,
    });
    const savedPost = await newPost.save();

    // await sendGeneralPushNotification({title:"New post", subtitle:title, body:description.slice(0,100)+ " read more..."})
    await sendPushNotification({
      title,
      subtitle: 'announcement',
      body: description.slice(0, 100) + ' read more...',
      // imageUrl: med,
    });

    res
      .status(201)
      .json({ data: savedPost, message: 'post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username'); // Assuming 'username' is a field in the Admin model
    res
      .status(200)
      .json({ data: posts, message: 'Posts fetched successfully' });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//   get a single post
exports.getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate('author', 'username');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ data: post, message: 'post fetched by id' });
  } catch (error) {
    console.error('Error getting post by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// filter posts

exports.filterPosts = async (req, res) => {
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
    const posts = await Post.find(query).sort(sortList).populate('author');
    if (posts.length <= 0) {
      return res
        .status(400)
        .json({ data: posts, message: 'No item match your search' });
    }
    return res
      .status(200)
      .json({ data: posts, message: 'fetched posts sucesfully' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: error, message: 'something went wrong' });
  }
};

// update post
exports.updatePostById = async (req, res) => {
  const { postId } = req.params;
  const { title, author, description } = req.body;

  try {
    // Check if postId is a valid ObjectId
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    console.log(req.filePaths, 'files');
    const mediaUrls: Media[] = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
    }));

    // Remove or update existing media URLs based on your requirements
    const existingMediaUrls = post.mediaUrls.filter(
      (existingMedia) =>
        !mediaUrls.some((newMedia) => newMedia.id === existingMedia.id),
    );

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: {
          title: title || post.title,
          author: author || post.author,
          description: description || post.description,
          mediaUrls: [...existingMediaUrls, ...mediaUrls],
        },
      },
      { new: true },
    ).populate('author', 'username');

    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res
      .status(200)
      .json({ data: updatedPost, message: 'post updated successfully' });
  } catch (error) {
    console.error('Error updating post by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// delete post by id
exports.deletePostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteImageFromPost = async (req, res) => {
  const { postId, imageId }: { postId: string; imageId: string } = req.params;

  try {
    const post = await Post.findByIdAndUpdate(postId, {
      mediaUrls: {
        $pull: {
          _id: imageId,
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // const updatedImages = post.mediaUrls.filter((image) => image.id !== imageId);

    // post.mediaUrls = updatedImages;
    // const updatedPost = await post.save();

    res.status(200).json({ data: post, message: 'Media has been deleted ' });
  } catch (error) {
    console.error('Error deleting image from post:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

module.exports;
