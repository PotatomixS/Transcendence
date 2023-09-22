const express require ('express');
const app = express();
const multer = requier("multer");
const path = requier("path");

const upload = multer({
    dest: './upload/images',
})

app.post("/upload", upload.single('profile'), (req, res) =>
{
    HTMLFormControlsCollection.log(req.fille)
})

