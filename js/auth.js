/**
 * AUTH.JS — Autenticación y gestión de sesión
 */

const USERS = [
    { email: 'empleado@fundaec.org', password: 'fundaec123', nombre: 'Carlos Mejía', rol: 'Empleado', cargo: 'Coordinador de Campo', proyecto: 'Programa Rural Andino' },
    { email: 'aprobador@fundaec.org', password: 'fundaec123', nombre: 'Lucía Fernández', rol: 'Aprobador', cargo: 'Directora de Programas', proyecto: 'Administración' },
    { email: 'finanzas@fundaec.org', password: 'fundaec123', nombre: 'Andrés Rodríguez', rol: 'Finanzas', cargo: 'Jefe de Finanzas', proyecto: 'Administración' },
    { email: 'admin@fundaec.org', password: 'fundaec123', nombre: 'Admin Sistema', rol: 'Administrador', cargo: 'Administrador TI', proyecto: 'Administración' },
    // Usuarios adicionales para reportes con datos
    { email: 'maria@fundaec.org', password: 'fundaec123', nombre: 'María González', rol: 'Empleado', cargo: 'Educadora', proyecto: 'Programa Educativo Sur' },
    { email: 'pedro@fundaec.org', password: 'fundaec123', nombre: 'Pedro Castro', rol: 'Empleado', cargo: 'Promotor', proyecto: 'Programa Rural Andino' },
];

const SESSION_KEY = 'fundaec_session';

const Auth = {
    login(email, password) {
        const user = USERS.find(u => u.email === email && u.password === password);
        if (!user) return null;
        const session = { ...user };
        delete session.password;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    },

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
    },

    getSession() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY));
        } catch { return null; }
    },

    isLoggedIn() {
        return !!this.getSession();
    },

    // Returns initials for avatar
    getInitials() {
        const s = this.getSession();
        if (!s) return '?';
        return s.nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    },

    // Permission matrix
    can(action) {
        const s = this.getSession();
        if (!s) return false;
        const rol = s.rol;
        const perms = {
            'crear_solicitud': ['Empleado', 'Administrador'],
            'ver_aprobaciones': ['Aprobador', 'Finanzas', 'Administrador'],
            'aprobar': ['Aprobador', 'Administrador'],
            'desembolsar': ['Finanzas', 'Administrador'],
            'cerrar': ['Finanzas', 'Aprobador', 'Administrador'],
            'ver_reportes': ['Finanzas', 'Administrador'],
            'admin_panel': ['Administrador'],
            'ver_todos': ['Finanzas', 'Aprobador', 'Administrador'],
        };
        return (perms[action] || []).includes(rol);
    },

    getAllUsers() {
        return USERS.map(u => ({ email: u.email, nombre: u.nombre, rol: u.rol, cargo: u.cargo, proyecto: u.proyecto }));
    }
};
