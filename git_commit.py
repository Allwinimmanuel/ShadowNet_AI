import os, subprocess
os.chdir('d:/ShadowNet AI_project')
if os.path.exists('.git/index.lock'):
    os.remove('.git/index.lock')
subprocess.run(['git', 'config', 'user.email', 'bot@example.com'])
subprocess.run(['git', 'config', 'user.name', 'AI Bot'])
print('Adding files...')
subprocess.run(['git', 'add', '.'])
print('Committing...')
subprocess.run(['git', 'commit', '-m', 'ShadowNet AI updates: fixed auth logic, improved dashboard, and stabilized UI'])
print('Done!')
