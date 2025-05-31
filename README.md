# VieFilm-Api

APIs for a movie ticket booking website.

---

## Requirements

To run this project, you'll need:

* **Node.js**: Version 18 or higher.
* **MongoDB**: We recommend using MongoDB Atlas for cloud-hosted database management.

---

## Installation

Follow these steps to get the project up and running on your local machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/lhv129/VieFilm-Api.git
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Create a `.env` file**:
    You'll need to create a `.env` file in the root directory of the project to store your sensitive configurations. This file should include:
    * **MongoDB connection string**: For connecting to your MongoDB Atlas database.
    * **Cloudinary API credentials**: For image and video hosting.
    * **Email service configurations**: For sending transactional emails.
    * **VNPay credentials**: For integrating with the payment gateway.

    _Example `.env` file (replace placeholders with your actual values):_
    ```
    MONGO_URI=your_mongodb_atlas_connection_string
    DATABASE_NAME=your_database_name_mongodb_atlas_connection_string
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    EMAIL_HOST=your_email_host
    EMAIL_PORT=your_email_port
    EMAIL_USER=your_email_user
    EMAIL_PASS=your_email_password
    VNPAY_TMN_CODE=your_vnpay_tmn_code
    VNPAY_HASH_SECRET=your_vnpay_hash_secret
    VNPAY_URL=your_vnpay_url
    ```

4.  **Run the project**:
    ```bash
    npm run dev
    ```

    The server will typically run at `http://localhost:8000`, or the port you've configured in your `.env` file.

---

## API Testing

A Postman collection is provided to help you test the APIs:

* **`viefilm-api.postman_collection`**: Import this file into Postman to access a pre-configured set of API endpoints and requests.

---

## Contributing

We welcome contributions! Please feel free to open issues or submit pull requests.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
