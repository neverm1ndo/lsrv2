export const USER_QUERY = `
    SELECT
        ug.user_id AS id,
        u.username,
        u.user_avatar AS avatar,
        u.group_id AS main_group,
        GROUP_CONCAT(DISTINCT ug.group_id ORDER BY ug.group_id SEPARATOR ',') AS permissions,
        u.user_email AS email,
        u.user_password AS password
    FROM phpbb_user_group AS ug
    JOIN phpbb_users AS u
        ON u.user_id = ug.user_id
    WHERE ug.user_id = ?
        AND ug.group_id BETWEEN 9 AND 14
    GROUP BY
        u.user_id,
        u.username,
        u.user_avatar,
        u.group_id,
        u.user_email,
        u.user_password;
`;

export const USER_QUERY_BY_EMAIL = `
    SELECT
        ug.user_id AS id,
        u.username,
        u.user_avatar AS avatar,
        u.group_id AS main_group,
        GROUP_CONCAT(DISTINCT ug.group_id ORDER BY ug.group_id SEPARATOR ',') AS permissions,
        u.user_email AS email,
        u.user_password AS password
    FROM phpbb_user_group AS ug
    JOIN phpbb_users AS u
        ON u.user_id = ug.user_id
    WHERE ug.user_email = ?
        AND ug.group_id BETWEEN 9 AND 14
    GROUP BY
        u.user_id,
        u.username,
        u.user_avatar,
        u.group_id,
        u.user_email,
        u.user_password;
`;
