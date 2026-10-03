export default function StatCard({
    title,
    value,
    icon,
    description,
}) {
    return (
        <div className="stat-card">
            <div className="stat-icon">
                {icon}
            </div>

            <div className="stat-content">
                <span>{title}</span>

                <strong>{value}</strong>

                {description && (
                    <small>
                        {description}
                    </small>
                )}
            </div>
        </div>
    );
}