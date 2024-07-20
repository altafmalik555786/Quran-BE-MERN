
const express = require('express');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = express.Router();
const User = require('../models/User');
const userAuth = require('../middlewares/userAuth');
const otpUserTimeVerify = require('../middlewares/otpUserTimeVerify');
const genrateOtp = require('../shared/genrateOtp');
const {uploadProfile, resizeProfileImage, deleteFile} = require('../middlewares/upload');
const {sendOtpOnEmail} = require('../shared/sendGridEmail');


router.post('/signup', async (req, res) => {
    if (req.body.isEmail) {
        const { error } = signUpEmailValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { name, email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: Already have an account on ${email} } })
            } else {
                const otp = genrateOtp();
                const salt = await bcrypt.genSalt(10);
                user = new User({
                    name,
                    email,
                    password: await bcrypt.hash(password, salt),
                    otp
                });
                // Saving User In the database
                user = await user.save();
                let dynamic_template_data = {
                    otp: otp
                }
                await sendOtpOnEmail(email, dynamic_template_data);
                const payload = { user: { id: user.id, isEmail: true } }
                let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                res.status(200).json({ data: { token: token ,isEmail:true, email: email, password: password}, meta: { statusCode: 200, status: true, message: Otp sended on ${email} } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        const { error } = signUpContactValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { name, contact, password } = req.body;
        try {
            let user = await User.findOne({ contact });
            if (user) {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: Already have an account on ${contact} } })
            } else {
                const otp = genrateOtp();
                const salt = await bcrypt.genSalt(10);
                user = new User({
                    name,
                    contact,
                    password: await bcrypt.hash(password, salt),
                    otp
                });
                // Saving User In the database
                user = await user.save();
                const payload = { user: { id: user.id, isEmail: false } }
                let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                res.status(200).json({ data: { token: token, isEmail:false, contact: contact, password: password }, meta: { statusCode: 200, status: true, message: Otp sended on ${contact} } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    }
});

router.post('/signin', async (req, res) => {
    if (req.body.isEmail) {
        const { error } = signInEmailValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email }, { _id: 1, password: 1 });
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    const otp = genrateOtp();
                    await User.findByIdAndUpdate(user.id, { $set: { otp: otp } })
                    let dynamic_template_data = {
                        otp: otp
                    }
                    await sendOtpOnEmail(email, dynamic_template_data);
                    const payload = { user: { id: user.id, isEmail: true } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                    res.status(200).json({ data: { token: token,id: user.id,isEmail: true, email: email, password: password }, meta: { statusCode: 200, status: true, message: Otp sended on ${email} } })
                } else {
                    return res.status(400).json({ meta: { statusCode: 400, status: false, message: Invalid credentials! } })
                }
            } else {
                return res.status(400).json({ meta: { statusCode: 400, status: false, message: Account doesn't exist! } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        const { error } = signInContactValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { contact, password } = req.body;
        try {
            let user = await User.findOne({ contact }, { _id: 1, password: 1 });
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    await User.findByIdAndUpdate(user.id, { $set: { otp: await genrateOtp() } })
                    const payload = { user: { id: user.id, isEmail: false } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                    res.status(200).json({ data: { token: token ,isEmail:false, contact: contact, password: password }, meta: { statusCode: 200, status: true, message: Otp sended on ${contact} } })
                } else {
                    return res.status(400).json({ meta: { statusCode: 400, status: false, message: Invalid credentials! } })
                }
            } else {
                return res.status(400).json({ meta: { statusCode: 400, status: false, message: Account doesn't exist! } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } })}
    }
});

router.post('/verify-signup-user-otp', otpUserTimeVerify, async (req, res) => {
    if (req.user.isEmail) {
        const { error } = otpValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { otp } = req.body;
        try {
            let user = await User.findById(req.user.id, { password: 0, otpCount: 0, updatedAt: 0, deletedAt: 0});
            if (user) {
                if (otp === user['otp']) {
                    if (user['isBlocked']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been blocked! } }) }
                    else if (user['isDeleted']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been deleted! } }) }
                    else {
                        await User.findByIdAndUpdate(
                            req.user.id,
                            { $set: { isEmailVerify: true } })
                        user.isEmailVerify = true;
                        const payload = { user: { id: user.id, isBlocked: user['isBlocked'], isDeleted: user['isDeleted'] } }
                        let token = await jwt.sign(payload, config.get('jwtSecret'), { expiresIn: config.get('TokenExpire') })
                        res.status(200).json({ data: { user: user, token: token }, meta: { statusCode: 200, status: true, message: Successfully LogedIn! } })
                    }
                } else {
                    res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
                }
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: "User is not valid!" } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        const { error } = otpValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { otp } = req.body;
        try {
            let user = await User.findById(req.user.id, { password: 0, otpCount: 0, updatedAt: 0, deletedAt: 0});
            if (user) {
                if (otp === user['otp']) {
                    if (user['isBlocked']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been blocked! } }) }
                    else if (user['isDeleted']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been deleted! } }) }
                    else {
                        await User.findByIdAndUpdate(
                            req.user.id,
                            { $set: { isContactVerify: true } })
                        user.isContactVerify = true;
                        const payload = { user: { id: user.id, isBlocked: user['isBlocked'], isDeleted: user['isDeleted'] } }
                        let token = await jwt.sign(payload, config.get('jwtSecret'), { expiresIn: config.get('TokenExpire') })
                        res.status(200).json({ data: { user: user, token: token }, meta: { statusCode: 200, status: true, message: Successfully LogedIn! } })
                    }
                } else {
                    res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
                }
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: "User is not valid!" } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } })}
    }
});

router.post('/verify-signin-user-otp', otpUserTimeVerify, async (req, res) => {
    if (req.user.isEmail) {
        const { error } = otpValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { otp } = req.body;
        try {
            let user = await User.findById(req.user.id, { password: 0, otpCount: 0, updatedAt: 0, deletedAt: 0});
            if (user) {
                if (otp === user['otp']) {
                    if (user['isBlocked']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been blocked! } }) }
                    else if (user['isDeleted']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been deleted! } }) }
                    else {
                        if (!user['isEmailVerify']) {
                            await User.findByIdAndUpdate(
                                req.user.id,
                                { $set: { isEmailVerify: true } })
                            user.isEmailVerify = true;
                        }
                        const payload = { user: { id: user.id, isBlocked: user['isBlocked'], isDeleted: user['isDeleted'] } }
                        let token = await jwt.sign(payload, config.get('jwtSecret'), { expiresIn: config.get('TokenExpire') })
                        res.status(200).json({ data: { user: user, token: token }, meta: { statusCode: 200, status: true, message: Successfully LogedIn! } })
                    }
                } else {
                    res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
                }
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: "User is not valid!" } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        const { error } = otpValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { otp } = req.body;
        try {
            let user = await User.findById(req.user.id, { password: 0, otpCount: 0, updatedAt: 0, deletedAt: 0});
            if (user) {
                if (otp === user['otp']) {
                    if (user['isBlocked']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been blocked! } }) }
                    else if (user['isDeleted']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been deleted! } }) }
                    else {
                        if (!user['isContactVerify']) {
                            await User.findByIdAndUpdate(
                                req.user.id,
                                { $set: { isContactVerify: true } })
                            user.isContactVerify = true;
                        }
                        const payload = { user: { id: user.id, isBlocked: user['isBlocked'], isDeleted: user['isDeleted'] } }
                        let token = await jwt.sign(payload, config.get('jwtSecret'), { expiresIn: config.get('TokenExpire') })
                        res.status(200).json({ data: { user: user, token: token }, meta: { statusCode: 200, status: true, message: Successfully LogedIn! } })
                    }
                } else {
                    res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
                }
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: "User is not valid!" } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } })}
    }
});

router.get('/refresh-token', userAuth, async (req, res) => {
        try {
            let user = await User.findById(req.user.id, { password: 0, otpCount: 0, updatedAt: 0, deletedAt: 0});
            if (user) {
                    if (user['isBlocked']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been blocked! } }) }
                    else if (user['isDeleted']) { return res.status(206).json({ meta: { statusCode: 206, status: false, message: Your account has been deleted! } }) }
                    else {
                        const payload = { user: { id: user.id, isBlocked: user['isBlocked'], isDeleted: user['isDeleted'] } }
                        let token = await jwt.sign(payload, config.get('jwtSecret'), { expiresIn: config.get('TokenExpire') })
                        res.status(200).json({ data: { user: user, token: token }, meta: { statusCode: 200, status: true, message: Successfully LogedIn! } })
                    }
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: "User is not valid!" } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } })}
    
});

router.put('/change-profile', userAuth, uploadProfile.single('image'), async (req, res) => {
    const { imagePath } = req.body;
    try {
        if (req.file) {
            if (imagePath != null && imagePath != "null") {
                deleteFile("avatar_"+imagePath, "profile");
            }
            let user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: { image: req.file.filename } }, { new: true });
            await resizeProfileImage(req.file)
            res.status(200).json({ data: { image: user['image'] }, meta: { statusCode: 200, status: true, message: Profile updated successfully! } })
        } else {
            res.status(400).json({ meta: { statusCode: 400, status: false, message: File is required! } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/change-name', userAuth, async (req, res) => {
    const { error } = nameValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { name } = req.body;
    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { name } }, { new: true });
        res.status(200).json({ data: { name: user['name'] }, meta: { statusCode: 200, status: true, message: User name updated successfully! } })
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/change-password', userAuth, async (req, res) => {
    const { error } = passwordValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { oldPassword, newPassword } = req.body;
    try {
        let user = await User.findById(req.user.id, { password: 1 });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (isMatch) {
            const salt = await bcrypt.genSalt(10);
            await User.findByIdAndUpdate(
                req.user.id,
                { $set: { password: await bcrypt.hash(newPassword, salt) } });
            res.status(200).json({ meta: { statusCode: 200, status: true, message: Password changed successfully! } })
        } else {
            res.status(206).json({ meta: { statusCode: 206, status: false, message: Credential doesn't match! } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/address', userAuth, async (req, res) => {
    const { error } = addressValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { province, city, postalOrZip, landmark, completeAddress } = req.body;
    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $push: { address: { province, city, postalOrZip, landmark, completeAddress }}}, { new: true })
        res.status(200).json({ data: { address: user['address']}, meta: { statusCode: 200, status: true, message: Successfully Added! } })
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/address-specific-index', userAuth, async (req, res) => {
    const { error } = specificAddressValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { province, city, postalOrZip, landmark, completeAddress, indexNumber } = req.body;
    try {
        let user = await User.findById(req.user.id);
        user['address'][indexNumber]={ province, city, postalOrZip, landmark, completeAddress };
        let userData = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { address: user['address']} }, { new: true })
        if(userData){
            res.status(200).json({ data: { address: userData['address']}, meta: { statusCode: 200, status: true, message: Address Successfully Updated! } })
        }else{
            res.status(206).json({ meta: { statusCode: 206, status: false, message: Address not Updated! } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});
router.delete('/deleteaddress/:indexNumber', userAuth, async (req, res) => {
    const indexNumber = req.params.indexNumber;
     try {
      let user = await User.findById(req.user.id);
      if (indexNumber >= 0 && indexNumber < user.address.length) {
        user.address.splice(indexNumber, 1);
         let userData = await User.findByIdAndUpdate(
           req.user.id,
          { $set: { address: user.address } },
          { new: true }
        );
        if (userData) {
          res.status(200).json({
            data: { address: userData.address },
            meta: { statusCode: 200, status: true, message: Address Successfully Deleted! },
          });
        } else {
          res.status(206).json({
            meta: { statusCode: 206, status: false, message: Address not Deleted! },
          });
        }
      } else {
        res.status(400).json({
          meta: {
            statusCode: 400,
            status: false,
            message: Invalid indexNumber provided.,
          },
        });
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
        meta: { statusCode: 500, status: false, message: 'Internal Server Error!' },
      });
    }
  });

router.put('/location', userAuth, async (req, res) => {
    const { error } = locationValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { latitude,  longitude, mapAddress, } = req.body;
   try {
        let user = await User.findByIdAndUpdate(
            req.user.id, 
            { $set: { latitude:latitude, longitude:longitude, mapAddress:mapAddress, isMapAddress:true } }, { new: true })
        res.status(200).json({ data: { latitude: user['latitude'], longitude:user['longitude'], mapAddress:user['mapAddress'], isMapAddress:user['isMapAddress'] }, meta: { statusCode: 200, status: true, message: Successfully Added! } })
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});



router.put('/change-email', userAuth, async (req, res) => {
    const { error } = emailValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { email } = req.body;
    try {
        let checkEmail = await User.findOne({email}, {email:1});
        if(!checkEmail){
            const otp = genrateOtp();
            await User.findByIdAndUpdate(req.user.id, { $set: { otp: otp } })
            const payload = { user: { id: req.user.id, email } }
            let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
            res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Otp sended on ${email} } })
        }else{
            res.status(400).json({ meta: { statusCode: 400, status: false, message: Already have an account! } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/verify-change-email', otpUserTimeVerify, async (req, res) => {
    const { error } = otpValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { otp } = req.body;
    try {
        let user = await User.findById(req.user.id, { otp: 1 });
        if (user) {
            if (otp === user['otp']) {
                let checkEmail = await User.findOne({email: req.user.email}, {email:1});
                if(!checkEmail){
                    await User.findByIdAndUpdate(
                        req.user.id,
                    { $set: { isEmailVerify: true, email: req.user.email } })
                    res.status(200).json({ data: { email: req.user.email, isEmailVerify: true }, meta: { statusCode: 200, status: true, message: Email updated successfully! } })
                }else{
                    res.status(400).json({ meta: { statusCode: 400, status: false, message: Already have an account! } })
                }
            } else {
                res.status(400).json({ meta: { statusCode: 400, status: false, message: "Otp is not valid!" } })
            }
        } else {
            return res.status(400).json({ meta: { statusCode: 400, status: false, message: "User is not valid!" } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/change-contact', userAuth, async (req, res) => {
    const { error } = contactValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { contact } = req.body;
    try {
        let checkContact = await User.findOne({contact}, {contact:1});
        if(!checkContact){
            const otp = genrateOtp();
            await User.findByIdAndUpdate(req.user.id, { $set: { otp: otp } })
            const payload = { user: { id: req.user.id, contact } }
            let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
            res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Otp sended on ${contact} } })
        }else{
            res.status(206).json({ meta: { statusCode: 400, status: false, message: Already have a contact! } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.put('/verify-change-contact', otpUserTimeVerify, async (req, res) => {
    const { error } = otpValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { otp } = req.body;
    try {
        let user = await User.findById(req.user.id, { otp: 1 });
        if (user) {
            if (otp === user['otp']) {
                let checkContact = await User.findOne({contact: req.user.contact}, {contact:1});
                if(!checkContact){
                    await User.findByIdAndUpdate(
                        req.user.id,
                    { $set: { isContactVerify: true, contact: req.user.contact } })
                    res.status(200).json({ data: { contact: req.user.contact, isContactVerify: true }, meta: { statusCode: 200, status: true, message: Contact updated successfully! } })
                }else{
                    res.status(400).json({ meta: { statusCode: 400, status: false, message: Already have a contact! } })
                }
            } else {
                res.status(400).json({ meta: { statusCode: 400, status: false, message: "Otp is not valid!" } })
            }
        } else {
            return res.status(400).json({ meta: { statusCode: 400, status: false, message: "User is not valid!" } })
        }
    } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
});

router.post('/forget-password', async (req, res) => {
    if (req.body.isEmail) {
        const { error } = forgetEmailValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { email } = req.body;
        try {
            let user = await User.findOne({ email }, { _id: 1, email: 1, isEmailVerify: 1 });
            if (user) {
                const otp = genrateOtp();
                await User.findByIdAndUpdate(user.id, { $set: { otp: otp } })
                const payload = { user: { id: user.id, isEmail: true,  isEmailVerify: user['isEmailVerify'] } }
                let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Otp sended on ${email} } })
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: Account doesn't exist! } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        const { error } = forgetContactValidation.validate(req.body);
        if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
        const { contact } = req.body;
        try {
            let user = await User.findOne({ contact }, { _id: 1, contact: 1, isContactVerify: 1 });
            if (user) {
                    const otp = genrateOtp();
                    await User.findByIdAndUpdate(user.id, { $set: { otp: otp } })
                    const payload = { user: { id: user.id, isEmail: false, isContactVerify: user['isContactVerify']  } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('OtpExpire') })
                    res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Otp sended on ${contact} } })
                
            } else {
                return res.status(206).json({ meta: { statusCode: 206, status: false, message: Account doesn't exist! } })
            }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    }
});

router.post('/verify-forget-password-otp', otpUserTimeVerify, async (req, res) => {
    const { error } = otpValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { otp } = req.body;
    if (req.user.isEmail) {
        try {
            let user = await User.findById(req.user.id, { otp: 1 });
            if (user) {
            if (otp === user['otp']) {
                if(req.user['isEmailVerify']){
                    const payload = { user: { id: req.user.id, email: req.user.email } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('changePassExpire') })
                    res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Update new password! } })
                }else{
                    await User.findByIdAndUpdate(
                        req.user.id,
                    { $set: { isEmailVerify: true, email: req.user.email } }, { new: true });
                    const payload = { user: { id: req.user.id, email: req.user.email } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('changePassExpire') })
                    res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Update new password! } })
                }
            } else {
                res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
            }
        } else {
            return res.status(400).json({ meta: { statusCode: 400, status: false, message: "User is not valid!" } })
        }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    } else {
        try {
            let user = await User.findById(req.user.id, { otp: 1 });
            if (user) {
            if (otp === user['otp']) {
                if(req.user['isContactVerify']){
                    const payload = { user: { id: req.user.id, contact: req.user.contact } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('changePassExpire') })
                    res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Update new password! } })
                }else{
                    await User.findByIdAndUpdate(
                        req.user.id,
                    { $set: { isContactVerify: true, email: req.user.email } }, { new: true })
                    const payload = { user: { id: req.user.id, contact: req.user.contact } }
                    let token = await jwt.sign(payload, config.get('OtpSecret'), { expiresIn: config.get('changePassExpire') })
                    res.status(200).json({ data: { token: token }, meta: { statusCode: 200, status: true, message: Update new password! } })
                }
            } else {
                res.status(404).json({ meta: { statusCode: 404, status: false, message: "Otp is not valid!" } })
            }
        } else {
            return res.status(400).json({ meta: { statusCode: 400, status: false, message: "User is not valid!" } })
        }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    }
});

router.put('/forget-change-password', otpUserTimeVerify, async (req, res) => {
    const { error } = changePasswordValidation.validate(req.body);
    if (error) { return res.status(400).json({ meta: { statusCode: 400, status: false, message: error.details[0].message } }) }
    const { password, confirmPassword } = req.body;
    if (password === confirmPassword) {
        try {
        const salt = await bcrypt.genSalt(10);
        let user = await User.findByIdAndUpdate(
            req.user.id,
        { $set: { password:await bcrypt.hash(password, salt) } }, { new: true })
        if(user){
            res.status(200).json({ meta: { statusCode: 200, status: true, message: Password upadated successfully! } })
        }else{
            res.status(400).json({ meta: { statusCode: 400, status: false, message: User doesn't exist! } })
        }
        } catch (error) { res.status(500).json({ meta: { statusCode: 500, status: false, message: "Internal Server Error!" } }) }
    }else{
        return res.status(400).json({ meta: { statusCode: 400, status: false, message: "Password doesn't match!" } })
    }
});

// Schema Validation 
const signUpEmailValidation = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    isEmail: Joi.boolean(),
    email: Joi.string().email().required(),
    password: Joi.string().required().max(20),
});

const signUpContactValidation = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    isEmail: Joi.boolean(),
    contact: Joi.string().min(6).max(15).required(),
    password: Joi.string().required().max(20),
});

const signInEmailValidation = Joi.object({
    isEmail: Joi.boolean(),
    email: Joi.string().email().required(),
    password: Joi.string().required().max(20),
});

const signInContactValidation = Joi.object({
    isEmail: Joi.boolean(),
    contact: Joi.string().min(6).max(15).required(),
    password: Joi.string().required().max(20),
});

const otpValidation = Joi.object({
    otp: Joi.number().integer().positive().required()
});

const nameValidation = Joi.object({
    name: Joi.string().min(3).max(50).required()
});

const passwordValidation = Joi.object({
    oldPassword: Joi.string().min(3).max(50).required(),
    newPassword: Joi.string().min(3).max(50).required()
});

const addressValidation = Joi.object({
    province: Joi.string().min(3).max(50).required(),
    city: Joi.string().min(3).max(50).required(),
    postalOrZip: Joi.number().required(),
    landmark: Joi.string().min(3).max(200).required(),
    completeAddress: Joi.string().min(3).max(100).required()
});

const locationValidation = Joi.object({
    mapAddress: Joi.string().min(3).max(150).required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
});

const emailValidation = Joi.object({
    email: Joi.string().email().required()
});

const contactValidation = Joi.object({
    contact: Joi.string().min(6).max(15).required(),
});

const forgetEmailValidation = Joi.object({
    isEmail: Joi.boolean(),
    email: Joi.string().email().required()
})

const forgetContactValidation = Joi.object({
    isEmail: Joi.boolean(),
    contact: Joi.string().min(6).max(15).required()
})

const changePasswordValidation = Joi.object({
    password: Joi.string().min(6).max(15).required(),
    confirmPassword: Joi.string().min(6).max(15).required()
})

const specificAddressValidation = Joi.object({
    province: Joi.string().min(3).max(50).required(),
    city: Joi.string().min(3).max(50).required(),
    postalOrZip: Joi.number().required(),
    landmark: Joi.string().min(3).max(200).required(),
    completeAddress: Joi.string().min(3).max(100).required(),
    indexNumber: Joi.number().required()
});

module.exports = router;