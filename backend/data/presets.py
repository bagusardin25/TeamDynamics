"""
Preset agent personas and crisis scenarios.
"""

PRESET_AGENTS = [
    {
        "id": "preset-1",
        "name": "Alex",
        "role": "Tech Lead",
        "type": "Strict & Burned Out",
        "color": "bg-red-500/20 text-red-500",
        "personality": {
            "empathy": 30,
            "ambition": 80,
            "stressTolerance": 25,
            "agreeableness": 20,
            "assertiveness": 90,
        },
    },
    {
        "id": "preset-2",
        "name": "Sam",
        "role": "Junior Dev",
        "type": "Ambitious & Naive",
        "color": "bg-green-500/20 text-green-500",
        "personality": {
            "empathy": 65,
            "ambition": 90,
            "stressTolerance": 30,
            "agreeableness": 80,
            "assertiveness": 25,
        },
    },
    {
        "id": "preset-3",
        "name": "Jordan",
        "role": "Product Manager",
        "type": "Empathetic",
        "color": "bg-blue-500/20 text-blue-500",
        "personality": {
            "empathy": 90,
            "ambition": 55,
            "stressTolerance": 70,
            "agreeableness": 85,
            "assertiveness": 40,
        },
    },
    {
        "id": "preset-4",
        "name": "Casey",
        "role": "Senior Dev",
        "type": "Silent & Efficient",
        "color": "bg-purple-500/20 text-purple-500",
        "personality": {
            "empathy": 40,
            "ambition": 60,
            "stressTolerance": 85,
            "agreeableness": 30,
            "assertiveness": 50,
        },
    },
]


CRISIS_SCENARIOS = {
    "rnd1": {
        "name": "Mandatory Weekend Coding for v2.0",
        "description": "Due to the tight v2.0 deadline, weekend coding is now mandatory for all engineering staff until further notice. No exceptions.",
        "severity": "high",
        "announcement": "🚨 ANNOUNCEMENT: Due to the tight v2.0 deadline, weekend coding is now mandatory for all engineering staff until further notice.",
    },
    "rnd2": {
        "name": "Budget Cut: 30% Layoffs Required",
        "description": "The board has announced an immediate 30% reduction in headcount across all departments. Managers must identify who stays and who goes by end of week.",
        "severity": "critical",
        "announcement": "🚨 URGENT: The board has mandated an immediate 30% reduction in headcount. Department heads must submit their layoff lists by Friday.",
    },
    "rnd3": {
        "name": "CEO Resigns Unexpectedly",
        "description": "The CEO has suddenly resigned effective immediately, citing 'personal reasons.' No successor has been named. The company's future is uncertain.",
        "severity": "critical",
        "announcement": "🚨 BREAKING: CEO has resigned effective immediately. Board is convening an emergency meeting. All-hands announcement postponed indefinitely.",
    },
    "rnd4": {
        "name": "Critical Database Deleted on Friday",
        "description": "A catastrophic database failure has wiped the production database on a Friday evening. Customer data may be lost. All hands on deck for recovery.",
        "severity": "high",
        "announcement": "🚨 CRITICAL INCIDENT: Production database has been wiped. All engineering staff are required to join the war room immediately for emergency recovery.",
    },
}
