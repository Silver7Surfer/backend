export const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password ) {
        return res.status(400).json({ 
            message: 'All fields are required',
            details: {
                username: !username ? 'Username is required' : null,
                email: !email ? 'Email is required' : null,
                password: !password ? 'Password is required' : null
            }
        });
    }

    if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            message: 'All fields are required',
            details: {
                email: !email ? 'Email is required' : null,
                password: !password ? 'Password is required' : null
            }
        });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    next();
};