const Feedback = require('../../models/feedback');

exports.createFeedback = async (req, res) => {
  const { id } = req.user;
  try {
    const feedback = await Feedback.create({
      ...req.body,
      author: id,
    });
    feedback.save();
    res.status(200).json({ message: 'Feedback created successfully' });
  } catch (error) {
    console.log('Fedback error : ', error);
    res.status(500).json({ message: 'Feedback creation failed', error });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();

    res
      .status(200)
      .json({ message: 'Feedbacks fetch successfully', data: feedbacks });
  } catch (error) {
    console.log('Fedback error : ', error);
    res.status(500).json({ message: 'Feedback sfetch failed', error });
  }
};

exports.markFeedbackAsSeen = async (req, res) => {
  const { id } = req.params;
  try {
    const feedback = await Feedback.findByIdAndUpdate(id, {
      $set: { seen: true },
    });
    feedback.save();

    res.status(200).json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.log('Fedback error : ', error);
    res.status(500).json({ message: 'Feedback update failed', error });
  }
};

