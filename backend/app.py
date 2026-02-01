from flask import Flask, request, jsonify
from flask_cors import CORS
from models import UserModel, LIMModel, UsageModel
import datetime

import os

# Serve static files from the compiled frontend
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app) # Allow frontend to access

@app.route('/')
def index():
    return app.send_static_file('index.html')

# Catch-all for React Router
@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

# --- Admin Authentication ---
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASS = "Marionete12"

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    if data.get('email') == ADMIN_EMAIL and data.get('password') == ADMIN_PASS:
        return jsonify({'user': {'id': 1, 'email': ADMIN_EMAIL}, 'isAdmin': True})
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/auth/me', methods=['GET'])
def me():
    # Mock for now since we are stateless/simple for this demo
    # In real app, check token
    return jsonify({'user': None, 'isAdmin': False}) # Default public

# --- Public/User Routes ---

@app.route('/funcionarios/validate', methods=['POST'])
def validate_nif():
    data = request.json
    nif = data.get('nif')
    user = UserModel.find_by_nif(nif)
    if user and user['ativo']:
        return jsonify(user)
    return jsonify({'error': 'Funcionário não encontrado ou inativo'}), 404

@app.route('/carrinhos', methods=['GET'])
def get_carrinhos():
    return jsonify(LIMModel.get_all())

@app.route('/uso_carrinho/ativos', methods=['GET'])
def get_usos_ativos():
    # Merge active uses and schedules for the frontend to display
    active = UsageModel.get_active_usages()
    scheduled = UsageModel.get_upcoming_schedules()
    return jsonify(active + scheduled)

@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.json
    try:
        UsageModel.start_use(data['carrinho_id'], data['funcionario_id'])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/return', methods=['POST'])
def return_cart():
    data = request.json
    try:
        success = UsageModel.end_use(data['carrinho_id'], data['funcionario_id'])
        if success:
            return jsonify({'success': True})
        return jsonify({'error': 'Nenhum uso ativo encontrado'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reserve', methods=['POST'])
def reserve_cart():
    data = request.json
    try:
        # TODO: Add logic to check conflicts
        UsageModel.create_schedule(
            data['carrinho_id'], 
            data['funcionario_id'], 
            data['start_time'], 
            data['end_time']
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Admin Routes ---

@app.route('/admin/carrinhos', methods=['POST'])
def create_carrinho():
    data = request.json
    try:
        LIMModel.create_lim(
            data['nome'], 
            data['identificador_fisico'], 
            data.get('ip_esp32', ''),
            data.get('localizacao', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/carrinhos/<id>', methods=['PUT'])
def update_carrinho(id):
    data = request.json
    try:
        LIMModel.update(id, data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/carrinhos/<id>', methods=['DELETE'])
def delete_carrinho(id):
    try:
        LIMModel.delete(id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/funcionarios', methods=['GET'])
def get_funcionarios():
    return jsonify(UserModel.get_all())

@app.route('/admin/funcionarios', methods=['POST'])
def create_funcionario():
    data = request.json
    try:
        UserModel.create_user(
            data['nif'], 
            data['nome'], 
            data.get('unidade', ''),
            data.get('ativo', True)
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/funcionarios/<id>', methods=['PUT'])
def update_funcionario(id):
    data = request.json
    try:
        UserModel.update(id, data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/funcionarios/<id>', methods=['DELETE'])
def delete_funcionario(id):
    try:
        UserModel.delete(id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/admin/historico', methods=['GET'])
def get_historico():
    return jsonify(UsageModel.get_history())

if __name__ == '__main__':
    app.run(debug=True, port=5000)
