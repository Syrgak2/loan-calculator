from django.shortcuts import render

# Create your views here.

from django.shortcuts import render


def loan_calculator(request):
    return render(request, 'caculator.html')
