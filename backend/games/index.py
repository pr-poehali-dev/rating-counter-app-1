import json
import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool

SCHEMA = 't_p17117659_rating_counter_app_1'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

# Connection pool — переиспользуем соединения между вызовами (warm start)
_pool = None

def get_pool():
    global _pool
    if _pool is None or _pool.closed:
        _pool = SimpleConnectionPool(1, 3, os.environ['DATABASE_URL'])
    return _pool

def get_conn():
    return get_pool().getconn()

def release_conn(conn):
    try:
        get_pool().putconn(conn)
    except Exception:
        try:
            conn.close()
        except Exception:
            pass


def handler(event: dict, context) -> dict:
    """GET — возвращает игры и игроков за один запрос. POST — сохраняет игру."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(f"SELECT id, data FROM {SCHEMA}.games ORDER BY updated_at DESC")
            game_rows = cur.fetchall()
            # avatar исключён — base64 данные раздувают ответ выше лимита 3.5МБ
            # Аватар загружается отдельно через GET /players?id=X
            cur.execute(
                f'SELECT id, name, email, points, wins, losses, games_played, join_date, is_admin FROM {SCHEMA}.players ORDER BY points DESC'
            )
            player_rows = cur.fetchall()
        finally:
            release_conn(conn)

        games = []
        for row in game_rows:
            g = dict(row[1]) if isinstance(row[1], dict) else json.loads(row[1])
            g['id'] = str(row[0])
            games.append(g)

        players = [_player_to_dict(r) for r in player_rows]

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'games': games, 'players': players}),
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        game = body.get('game')
        if not game or not game.get('id'):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'game.id обязателен'})}

        game_id = str(game['id'])
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f'''INSERT INTO {SCHEMA}.games (id, data, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()''',
                (game_id, json.dumps(game))
            )
            conn.commit()
        except Exception:
            conn.rollback()
            release_conn(conn)
            raise
        finally:
            release_conn(conn)

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}


def _player_to_dict(row):
    # row: id, name, email, points, wins, losses, games_played, join_date, is_admin (без avatar)
    return {
        'id': str(row[0]),
        'name': row[1],
        'email': row[2],
        'avatar': '',
        'points': row[3] or 0,
        'wins': row[4] or 0,
        'losses': row[5] or 0,
        'gamesPlayed': row[6] or 0,
        'joinDate': str(row[7]),
        'isAdmin': bool(row[8]),
        'password': '',
    }