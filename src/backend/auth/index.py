import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

ADMIN_EMAILS = ['dmitry.ilyin@example.com']


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Регистрация и вход игроков страйкбол-рейтинга."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')  # 'register' | 'login'

    if action == 'register':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        name = (body.get('name') or '').strip()

        if not email or not password or not name:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id FROM players WHERE email = %s', (email,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Email уже зарегистрирован'})}

        is_admin = email in ADMIN_EMAILS
        cur.execute(
            'INSERT INTO players (name, email, password, is_admin) VALUES (%s, %s, %s, %s) RETURNING id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin',
            (name, email, password, is_admin)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        player = _row_to_dict(row)
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'player': player})}

    if action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if not email or not password:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите email и пароль'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            'SELECT id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin, password FROM players WHERE email = %s',
            (email,)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Аккаунт не найден'})}
        if row[10] != password:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный пароль'})}

        player = _row_to_dict(row[:10])
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'player': player})}

    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестное действие'})}


def _row_to_dict(row):
    return {
        'id': str(row[0]),
        'name': row[1],
        'email': row[2],
        'avatar': row[3] or '',
        'points': row[4],
        'wins': row[5],
        'losses': row[6],
        'gamesPlayed': row[7],
        'joinDate': str(row[8]),
        'isAdmin': row[9],
        'password': '',
    }
