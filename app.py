from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')  # Main page

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy-policy.html')  # Privacy Policy page

@app.route('/terms-conditions')
def terms_conditions():
    return render_template('terms-conditions.html')  # Terms & Conditions page

@app.route('/contact')
def contact():
    return render_template('contact.html')  # Contact page

if __name__ == '__main__':
    app.run(debug=True)
