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
    """
    GET            — список игроков без аватара (base64 превышает лимит ответа)
    GET ?id=X      — один игрок с аватаром (для профиля)
    POST           — обновление профиля
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        player_id = params.get('id')
        conn = get_conn()
        try:
            cur = conn.cursor()
            if player_id:
                # Один игрок с аватаром
                cur.execute(
                    f'SELECT id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin FROM {SCHEMA}.players WHERE id = %s',
                    (int(player_id),)
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'player': _row_to_dict(row)})}
            else:
                # Все игроки — без avatar
                cur.execute(
                    f'SELECT id, name, email, points, wins, losses, games_played, join_date, is_admin FROM {SCHEMA}.players ORDER BY points DESC'
                )
                rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'players': [_row_no_avatar(r) for r in rows]})}
        finally:
            release_conn(conn)

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        player_id = body.get('id')
        updates = body.get('updates', {})

        if not player_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'id обязателен'})}

        allowed = {
            'name': 'name',
            'avatar': 'avatar',
            'points': 'points',
            'wins': 'wins',
            'losses': 'losses',
            'gamesPlayed': 'games_played',
        }
        sets, vals = [], []
        for key, col in allowed.items():
            if key in updates:
                sets.append(f'{col} = %s')
                vals.append(updates[key])

        if not sets:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет данных для обновления'})}

        vals.append(int(player_id))
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f'UPDATE {SCHEMA}.players SET {", ".join(sets)} WHERE id = %s RETURNING id, name, email, avatar, points, wins, losses, games_played, join_date, is_admin',
                vals
            )
            row = cur.fetchone()
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            release_conn(conn)

        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Игрок не найден'})}

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'player': _row_to_dict(row)})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}


def _row_to_dict(row):
    """Полный профиль с аватаром (10 колонок)."""
    return {
        'id': str(row[0]),
        'name': row[1],
        'email': row[2],
        'avatar': row[3] or '',
        'points': row[4] or 0,
        'wins': row[5] or 0,
        'losses': row[6] or 0,
        'gamesPlayed': row[7] or 0,
        'joinDate': str(row[8]),
        'isAdmin': bool(row[9]),
        'password': '',
    }


def _row_no_avatar(row):
    """Список без аватара (9 колонок)."""
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
