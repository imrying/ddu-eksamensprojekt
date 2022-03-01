import json

file = open(r'C:\Users\phili\programming\ddu-eksamensprojekt\tools\issues.json', encoding='utf-8')

data = json.load(file)


print(data[0]['duration'])