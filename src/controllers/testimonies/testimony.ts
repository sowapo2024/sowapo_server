const Testimony = require('../../models/testimony'); 

// Create Testimony
exports.createTestimony = async (req, res) => {
  try {
    const { title, phone, email, address, testifier, testimony, testimonyType } = req.body;
    const newTestimony = new Testimony({
      title,
      phone,
      email,
      address,
      testifier,
      testimony,
      testimonyType,
    });
    const savedTestimony = await newTestimony.save();

    res.status(201).json({ data: savedTestimony, message: 'Testimony created successfully' });
  } catch (error) {
    console.error('Error in createTestimony:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read All Testimonies
exports.getAllTestimonies = async (req, res) => {
  try {
    const testimonies = await Testimony.find();
    res.status(200).json({ data: testimonies, message: 'Fetched all testimonies successfully' });
  } catch (error) {
    console.error('Error in getAllTestimonies:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Read Single Testimony
exports.getTestimonyById = async (req, res) => {
  try {
    const testimony = await Testimony.findById(req.params.id);
    if (!testimony) {
      return res.status(404).json({ message: 'Testimony not found' });
    }
    res.status(200).json({ data: testimony, message: 'Fetched testimony successfully' });
  } catch (error) {
    console.error('Error in getTestimonyById:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

//Read testimonies made by a single email
exports.getAllTestimoniesByEmail = async (req, res) => {
    const {email}:{email:string} = req.body
    try {
      const testimonies = await Testimony.find({email:email});
      res.status(200).json({ data: testimonies, message: 'Fetched all testimonies successfully' });
    } catch (error) {
      console.error('Error in getAllTestimonies:', error);
      res.status(500).json({ error: error.message, message: 'Something went wrong' });
    }
  };

// Update Testimony
exports.updateTestimony = async (req, res) => {
  try {
    const updatedTestimony = await Testimony.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTestimony) {
      return res.status(404).json({ message: 'Testimony not found' });
    }
    res.status(200).json({ data: updatedTestimony, message: 'Testimony updated successfully' });
  } catch (error) {
    console.error('Error in updateTestimony:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};

// Delete Testimony
exports.deleteTestimony = async (req, res) => {
  try {
    const deletedTestimony = await Testimony.findByIdAndDelete(req.params.id);
    if (!deletedTestimony) {
      return res.status(404).json({ message: 'Testimony not found' });
    }
    res.status(200).json({ data: deletedTestimony, message: 'Testimony deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTestimony:', error);
    res.status(500).json({ error: error.message, message: 'Something went wrong' });
  }
};
