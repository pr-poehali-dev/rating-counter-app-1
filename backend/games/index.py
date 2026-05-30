import json
import os
import psycopg2


SCHEMA = 't_p17117659_rating_counter_app_1'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Получение всех игр (GET) и сохранение/обновление игры (POST)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f'SELECT id, data FROM {SCHEMA}.games ORDER BY (data->>\'createdAt\') DESC')
        rows = cur.fetchall()
        conn.close()
        games = []
        for row in rows:
            g = row[1]
            g['id'] = row[0]
            games.append(g)
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'games': games})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        game = body.get('game')
        if not game or not game.get('id'):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'game.id обязателен'})}

        game_id = game['id']
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f'''INSERT INTO {SCHEMA}.games (id, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
                RETURNING id''',
            (game_id, json.dumps(game))
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}