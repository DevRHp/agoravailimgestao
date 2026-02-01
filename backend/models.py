from db import get_db
from bson.objectid import ObjectId
import datetime

# --- Collections ---
def get_users_collection():
    return get_db().get_collection('funcionarios')

def get_lims_collection():
    return get_db().get_collection('carrinhos')

def get_usage_collection():
    return get_db().get_collection('uso_carrinho')

# --- User (Funcionario) ---
class UserModel:
    @staticmethod
    def create_user(nif, name, unit='', active=True):
        user = {
            'nif': nif,
            'nome': name,
            'unidade': unit,
            'ativo': active,
            'created_at': datetime.datetime.now()
        }
        result = get_users_collection().insert_one(user)
        user['id'] = str(result.inserted_id)
        return user

    @staticmethod
    def find_by_nif(nif):
        user = get_users_collection().find_one({'nif': nif})
        if user:
            user['id'] = str(user['_id'])
            del user['_id']
        return user

    @staticmethod
    def get_all():
        users = list(get_users_collection().find())
        for u in users:
            u['id'] = str(u['_id'])
            del u['_id']
        return users

    @staticmethod
    def delete(user_id):
        get_users_collection().delete_one({'_id': ObjectId(user_id)})
    
    @staticmethod
    def update(user_id, data):
        get_users_collection().update_one({'_id': ObjectId(user_id)}, {'$set': data})

# --- LIM (Carrinho) ---
class LIMModel:
    @staticmethod
    def create_lim(name, code, ip_esp32='', location=''):
        lim = {
            'nome': name,
            'identificador_fisico': code,
            'ip_esp32': ip_esp32,
            'localizacao': location,
            'status': 'DISPONIVEL', # DISPONIVEL, EM_USO, MANUTENCAO, AGENDADO
            'created_at': datetime.datetime.now()
        }
        result = get_lims_collection().insert_one(lim)
        lim['id'] = str(result.inserted_id)
        return lim

    @staticmethod
    def get_all():
        lims = list(get_lims_collection().find())
        for l in lims:
            l['id'] = str(l['_id'])
            del l['_id']
            # Default location if missing
            if 'localizacao' not in l:
                l['localizacao'] = ''
        return lims

    @staticmethod
    def update_status(lim_id, status):
        get_lims_collection().update_one(
            {'_id': ObjectId(lim_id)},
            {'$set': {'status': status}}
        )

    @staticmethod
    def update(lim_id, data):
        get_lims_collection().update_one({'_id': ObjectId(lim_id)}, {'$set': data})

    @staticmethod
    def delete(lim_id):
        get_lims_collection().delete_one({'_id': ObjectId(lim_id)})

# --- Usage/Schedule ---
class UsageModel:
    @staticmethod
    def start_use(cart_id, user_id):
        usage = {
            'carrinho_id': cart_id,
            'funcionario_id': user_id,
            'data_hora_inicio': datetime.datetime.now(),
            'data_hora_fim': None,
            'status': 'EM_USO'
        }
        result = get_usage_collection().insert_one(usage)
        
        # Update LIM status
        LIMModel.update_status(cart_id, 'EM_USO')
        
        usage['id'] = str(result.inserted_id)
        return usage

    @staticmethod
    def end_use(cart_id, user_id):
        # Find active usage
        usage = get_usage_collection().find_one({
            'carrinho_id': cart_id,
            'funcionario_id': user_id,
            'status': 'EM_USO'
        })
        
        if usage:
            get_usage_collection().update_one(
                {'_id': usage['_id']},
                {'$set': {
                    'data_hora_fim': datetime.datetime.now(),
                    'status': 'FINALIZADO'
                }}
            )
            # Update LIM status
            LIMModel.update_status(cart_id, 'DISPONIVEL')
            return True
        return False

    @staticmethod
    def get_active_usages():
        usages = list(get_usage_collection().find({'status': 'EM_USO'}))
        for u in usages:
            u['id'] = str(u['_id'])
            del u['_id']
        return usages
    
    @staticmethod
    def get_history():
        usages = list(get_usage_collection().find().sort('data_hora_inicio', -1))
        # Enrich with names
        results = []
        for u in usages:
            u['id'] = str(u['_id'])
            del u['_id']
            
            # Fetch names (could be optimized with aggregate/lookup)
            cart = get_lims_collection().find_one({'_id': ObjectId(u['carrinho_id'])})
            user = get_users_collection().find_one({'_id': ObjectId(u['funcionario_id'])})
            
            u['carrinho'] = {'nome': cart['nome']} if cart else {'nome': 'Desconhecido'}
            u['funcionario'] = {'nome': user['nome'], 'nif': user['nif']} if user else {'nome': 'Desconhecido', 'nif': '?'}
            
            # Format dates iso string for frontend
            if isinstance(u.get('data_hora_inicio'), datetime.datetime):
                u['data_hora_inicio'] = u['data_hora_inicio'].isoformat()
            if isinstance(u.get('data_hora_fim'), datetime.datetime):
                u['data_hora_fim'] = u['data_hora_fim'].isoformat()
                
            results.append(u)
        return results

    @staticmethod
    def get_upcoming_schedules():
        # Get schedules that are 'AGENDADO'
        schedules = list(get_usage_collection().find({'status': 'AGENDADO'}))
        results = []
        for s in schedules:
            s['id'] = str(s['_id'])
            del s['_id']
            # Format dates
            if isinstance(s.get('data_hora_inicio'), datetime.datetime):
                s['data_hora_inicio'] = s['data_hora_inicio'].isoformat()
            if isinstance(s.get('data_hora_fim'), datetime.datetime):
                s['data_hora_fim'] = s['data_hora_fim'].isoformat()
            results.append(s)
        return results

    @staticmethod
    def create_schedule(cart_id, user_id, start_time_iso, end_time_iso):
        schedule = {
            'carrinho_id': cart_id,
            'funcionario_id': user_id,
            'data_hora_inicio': datetime.datetime.fromisoformat(start_time_iso.replace('Z', '+00:00')),
            'data_hora_fim': datetime.datetime.fromisoformat(end_time_iso.replace('Z', '+00:00')),
            'status': 'AGENDADO'
        }
        result = get_usage_collection().insert_one(schedule)
        schedule['id'] = str(result.inserted_id)
        LIMModel.update_status(cart_id, 'AGENDADO') # Indicate it has connection, though logic might need to be smarter if it's future
        return schedule
