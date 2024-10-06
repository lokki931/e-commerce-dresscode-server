const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');

// function exclude field in result obj
function exclude(user, ...keys) {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

const register = async (req, res) => {
  try {
    const { email, password, orders } = req.body;

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json('user already exists');
    }

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        orders: orders || [],
      },
    });

    const createdUserNotPassword = exclude(createdUser, 'password');

    res.status(201).json({ user: createdUserNotPassword });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: 'Error register' });
  }
};

const login = async (req, res) => {
  try {
    //    get the user from req.body
    const { email, password } = req.body;
    //   check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // check if the password matches to the one in the db
      const comparePassword = bcrypt.compareSync(password, user.password);

      if (comparePassword) {
        // sign the token
        const payload = {
          userId: user.id,
        };
        jwt.sign(
          payload,
          process.env.JWTSECRET,
          {
            expiresIn: '30d',
          },
          (err, token) => {
            if (err || !token) {
              return res.status(401).json('token was not found');
            }
            return res.status(200).json({
              token: token,
            });
          },
        );
      } else {
        res.status(500).json({ error: 'Error password' });
      }
    } else {
      res.status(500).json({ error: 'Users not found' });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: 'Error fetching user' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    const newUsers = users.map((user) => exclude(user, 'password'));

    res.json(newUsers);
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: 'Error fetching users' });
  }
};

const me = async (req, res) => {
  const id = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const userWithoutPassword = exclude(user, 'password');

    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: 'Error fetching user' });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  me,
};
