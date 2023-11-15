const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iyvtyio.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });
async function run() {
    try {
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions')
        const bookingsCollection = client.db('doctorsPortal').collection('bookingsCollection')

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {}
            const options = await appointmentOptionCollection.find(query).toArray();

            //provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()

            //code carefully
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlots = optionBooked.map(book => book.slot)
                const reamainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = reamainingSlots;

            })
            res.send(options)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You already booked on ${booking.appointmentDate}`
                return res.send({ acknowledge: false, message })
            }
            const result = await bookingsCollection.insertOne(booking)
            console.log(result);
            res.send(result)
        })

        app.get('/bookings', async (req, res) => {
            const query = {}
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })
    } finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('doctors portal server is running');
})
app.listen(port, () => console.log(`Doctors portal running on ${port}`))