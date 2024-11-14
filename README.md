# Portfolio Website

[tylerhweiss.com](https://tylerhweiss.com/)

This is my portfolio website that showcases my skills and projects. It also allows visitors to send an interest form via an email to me using a contact form. This project is hosted on [`Firebase`](https://firebase.google.com/).

## Installation

To install the project, follow these steps:

1. Clone the repository to your local machine.
2. Change the directory and go into the functions folder.

   ```bash
   cd <Your_Project_Location>
   cd functions
   ```

3. Install the required dependencies.

   ```bash
   npm install
   ```

4. Create a .env file in the functions folder and set the email and password you want emails to be sent to.

   ```bash
   EMAIL_SENDER=<YOUR_EMAIL>
   EMAIL_SENDER_PASSWORD=<YOUR_EMAIL_PASSWORD>
   ```

5. Add the `<a href="https://www.google.com/recaptcha/about/" target="_blank">`reCAPTCHA `</a>` site key and secret key to the .env file.

   ```bash
   RECAPTCHA_SITE_KEY=<YOUR_SITE_KEY>
   RECAPTCHA_SECRET_KEY=<YOUR_SECRET_KEY>
   ```

6. Start the server

   ```bash
   npm run start
   ```

## Usage

To use the website, follow these steps:

1. Open the website in a web browser.
2. Browse through to see all of my skills and personal projects
3. Fill out the contact form with your name, email address, and message.
4. Click the "Send" button to send an email to me.

## Credits

This project was created by Tyler Weiss
