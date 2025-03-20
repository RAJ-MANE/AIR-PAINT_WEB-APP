from flask import Flask, render_template, send_from_directory

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

@app.route('/favicon.png')
def favicon():
    return send_from_directory('static', 'favicon.png', mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)

